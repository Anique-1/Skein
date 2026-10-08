package com.skein.mesh.ble

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.concurrent.ConcurrentHashMap

private const val TAG = "SkeinBle"

class SkeinBleModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")

  private var bluetoothManager: BluetoothManager? = null
  private var bluetoothAdapter: BluetoothAdapter? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var scanner: BluetoothLeScanner? = null
  private var gattServer: BluetoothGattServer? = null

  private var serviceUuid: UUID? = null
  private var charUuid: UUID? = null

  // Active outgoing GATT connections (devices we connected to as Central)
  private val activeClients = ConcurrentHashMap<String, BluetoothGatt>()

  // Connected devices on our GATT server (devices that connected to us as Peripheral)
  private val connectedServerDevices = ConcurrentHashMap<String, BluetoothDevice>()

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
      Log.i(TAG, "BLE advertising started successfully")
    }

    override fun onStartFailure(errorCode: Int) {
      Log.e(TAG, "BLE advertising failed with error: $errorCode")
    }
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
      if (newState == BluetoothProfile.STATE_CONNECTED) {
        Log.i(TAG, "GATT server: device connected: ${device.address}")
        connectedServerDevices[device.address] = device
      } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
        Log.i(TAG, "GATT server: device disconnected: ${device.address}")
        connectedServerDevices.remove(device.address)
      }
    }

    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray?
    ) {
      if (responseNeeded) {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
      }

      if (value != null && value.isNotEmpty()) {
        try {
          val payload = String(value, StandardCharsets.UTF_8)
          sendEvent("onPacketReceived", mapOf("payload" to payload))
        } catch (e: Exception) {
          Log.e(TAG, "Failed to decode packet", e)
        }
      }
    }
  }

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device ?: return
      val address = device.address

      // Don't connect if we already have an active connection to this device
      if (activeClients.containsKey(address) || connectedServerDevices.containsKey(address)) {
        return
      }

      Log.i(TAG, "Discovered Skein peer: $address. Connecting GATT...")
      connectToPeer(device)
    }

    override fun onScanFailed(errorCode: Int) {
      Log.e(TAG, "BLE scan failed with error: $errorCode")
    }
  }

  private fun connectToPeer(device: BluetoothDevice) {
    try {
      device.connectGatt(context, false, object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
          if (newState == BluetoothProfile.STATE_CONNECTED) {
            Log.i(TAG, "Connected to peer: ${device.address}. Discovering services...")
            activeClients[device.address] = gatt
            gatt.discoverServices()
          } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
            Log.i(TAG, "Disconnected from peer: ${device.address}")
            activeClients.remove(device.address)
            gatt.close()
          }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
          if (status == BluetoothGatt.GATT_SUCCESS) {
            Log.i(TAG, "Discovered services on peer: ${device.address}")
            try {
              gatt.requestMtu(512)
            } catch (e: Exception) {
              Log.w(TAG, "Could not request MTU", e)
            }
          }
        }
      }, BluetoothDevice.TRANSPORT_LE)
    } catch (e: SecurityException) {
      Log.e(TAG, "Missing bluetooth permission when connecting to peer", e)
    } catch (e: Exception) {
      Log.e(TAG, "Error connecting to peer", e)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("SkeinBle")

    Events("onPacketReceived")

    AsyncFunction("start") { serviceUuidStr: String, charUuidStr: String ->
      try {
        serviceUuid = UUID.fromString(serviceUuidStr)
        charUuid = UUID.fromString(charUuidStr)

        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
          ?: throw IllegalStateException("BluetoothManager not available")
        bluetoothAdapter = bluetoothManager?.adapter
          ?: throw IllegalStateException("BluetoothAdapter not available")

        if (!bluetoothAdapter!!.isEnabled) {
          throw IllegalStateException("Bluetooth is disabled. Please turn on Bluetooth.")
        }

        // 1. Setup GATT Server (Peripheral mode)
        gattServer = bluetoothManager?.openGattServer(context, gattServerCallback)
        if (gattServer != null) {
          val service = BluetoothGattService(serviceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY)
          val characteristic = BluetoothGattCharacteristic(
            charUuid,
            BluetoothGattCharacteristic.PROPERTY_READ or
              BluetoothGattCharacteristic.PROPERTY_WRITE or
              BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
              BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ or
              BluetoothGattCharacteristic.PERMISSION_WRITE
          )
          service.addCharacteristic(characteristic)
          gattServer?.addService(service)
        }

        // 2. Start Advertising (Peripheral mode)
        advertiser = bluetoothAdapter?.bluetoothLeAdvertiser
        if (advertiser != null) {
          val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .build()

          val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(serviceUuid))
            .build()

          advertiser?.startAdvertising(settings, data, advertiseCallback)
        }

        // 3. Start Scanning (Central mode)
        scanner = bluetoothAdapter?.bluetoothLeScanner
        if (scanner != null) {
          val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(serviceUuid))
            .build()

          val scanSettings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

          scanner?.startScan(listOf(filter), scanSettings, scanCallback)
        }

        Log.i(TAG, "Skein BLE mesh transport started successfully")
      } catch (e: SecurityException) {
        Log.e(TAG, "Bluetooth permissions not granted", e)
        throw e
      } catch (e: Exception) {
        Log.e(TAG, "Failed to start BLE transport", e)
        throw e
      }
    }

    AsyncFunction("broadcast") { payload: String ->
      try {
        val bytes = payload.toByteArray(StandardCharsets.UTF_8)
        val sUuid = serviceUuid ?: return@AsyncFunction
        val cUuid = charUuid ?: return@AsyncFunction

        for ((_, gatt) in activeClients) {
          try {
            val service = gatt.getService(sUuid)
            val characteristic = service?.getCharacteristic(cUuid)
            if (characteristic != null) {
              if (android.os.Build.VERSION.SDK_INT >= 33) {
                gatt.writeCharacteristic(
                  characteristic,
                  bytes,
                  BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                )
              } else {
                @Suppress("DEPRECATION")
                characteristic.value = bytes
                @Suppress("DEPRECATION")
                characteristic.writeType = BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
                @Suppress("DEPRECATION")
                gatt.writeCharacteristic(characteristic)
              }
            }
          } catch (e: Exception) {
            Log.w(TAG, "Failed to write packet to peer", e)
          }
        }
      } catch (e: Exception) {
        Log.e(TAG, "Error broadcasting packet", e)
      }
    }

    AsyncFunction("stop") {
      try {
        try {
          advertiser?.stopAdvertising(advertiseCallback)
        } catch (_: Exception) {}

        try {
          scanner?.stopScan(scanCallback)
        } catch (_: Exception) {}

        for ((_, gatt) in activeClients) {
          try {
            gatt.disconnect()
            gatt.close()
          } catch (_: Exception) {}
        }
        activeClients.clear()

        try {
          gattServer?.close()
        } catch (_: Exception) {}
        connectedServerDevices.clear()

        Log.i(TAG, "Skein BLE mesh transport stopped")
      } catch (e: Exception) {
        Log.e(TAG, "Error stopping BLE transport", e)
      }
    }
  }
}
