import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:torch_light/torch_light.dart';
import 'package:flutter_blue/flutter_blue.dart';
import 'dart:developer';
import 'package:http/http.dart' as http;
// import 'package:crypto/crypto.dart' ;
// import 'package:cryptoutils/cryptoutils.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // Try running your application with "flutter run". You'll see the
        // application has a blue toolbar. Then, without quitting the app, try
        // changing the primarySwatch below to Colors.green and then invoke
        // "hot reload" (press "r" in the console where you ran "flutter run",
        // or simply save your changes to "hot reload" in a Flutter IDE).
        // Notice that the counter didn't reset back to zero; the application
        // is not restarted.
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class HttpRequestToServe {
  String _cookies = "";

  // Future<Map> get(String url) async {
  //   http.Response response = await http.get(Uri.parse(url), headers: _cookies);
  //   updateCookie(response);
  //   return json.decode(response.body);
  // }

  Future<http.Response> post(String url,
      [Map<String, String> headers = const {},  dynamic data = const {}]) async {
    if (_cookies != null) {
      headers["cookie"] = _cookies;
    }
    print(headers);
    http.Response response =
        await http.post(Uri.parse(url), headers: headers, body: json.encode(data));
    updateCookie(response);
    return response;
  }

  void updateCookie(http.Response response) {
    String? rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      int index = rawCookie.indexOf(';');
      _cookies = (index == -1) ? rawCookie : rawCookie.substring(0, index);
    }
  }
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;
  List<DeviceIdentifier> detectedDevicesMac = [];
  List<String> detectedDevicesName = [];

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }


  Future<void> sendDevicesDetected() async {
    if (detectedDevicesMac.length<=0)return;
    var url = 'https://polytech-abscence.loca.lt//api/login';
    var headers = {"Content-Type": "application/json"};
    dynamic body = {"email": "alex@a.aa", "password": "aezr"};
    print(body);
    HttpRequestToServe req = HttpRequestToServe();
    var response = await req.post(url, headers, body);
    // var response = await http.post(url, headers:headers,body: body);
    print('Response status: ${response.statusCode}');
    print('Response body: ${response.body}');
    print('Response cookies: ${response.headers}');

    
    var deviceInfosTmp = [];
    for (var i=0 ; i<detectedDevicesMac.length;i++){
      if (detectedDevicesName[i].length>0){
        // var bytes = ;
        // var base64 = CryptoUtils.bytesToBase64(bytes);
        deviceInfosTmp.add({"device_mac":  detectedDevicesMac[i].toString(), "device_name":  detectedDevicesName[i]});
        // deviceInfosTmp.add({"device_mac": utf8.encode(detectedDevicesMac[i]), "device_name":utf8.encode(detectedDevicesName[i])});
      }else{
        deviceInfosTmp.add({"device_mac":  detectedDevicesMac[i].toString(), "device_name":  detectedDevicesName[i]});
        // deviceInfosTmp.add({"device_mac": detectedDevicesMac[i], "device_name":"EMPTY_NAME"});
      }
    }
    body = {"devices":deviceInfosTmp};
    print(body);
    url = 'https://polytech-abscence.loca.lt//api/devicesDetected';
    response = await req.post(url, headers, body);
    print('Response status: ${response.statusCode}');
    print('Response body: ${response.body}');
    print('Response cookies: ${response.headers}');
  }

  void manageFlashlight() async {
    // _incrementCounter();
    FlutterBlue flutterBlue = FlutterBlue.instance;
    var scanDuration = 4;
    flutterBlue.startScan(timeout: Duration(seconds: scanDuration));

// Listen to scan results

    var subscription = flutterBlue.scanResults.listen((results) async {
      // _incrementCounter();
      for (ScanResult r in results) {
        // await r.device.connect();

        // Disconnect from device
        // await r.device.disconnect();
        //04:ed:33:51:5e:a9
        var a = 455;
        if (!detectedDevicesMac.contains(r.device.id)) {
          log('detected Device : ${r.device.id} ${r.device.name}');
          _incrementCounter();

          detectedDevicesMac.add(r.device.id);
          detectedDevicesName.add(r.device.name);
        }

      }
    });
    Timer(Duration(seconds: scanDuration), () {
      log('scan ended');
      sendDevicesDetected();
    });


  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also a layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Invoke "debug painting" (press "p" in the console, choose the
          // "Toggle Debug Paint" action from the Flutter Inspector in Android
          // Studio, or the "Toggle Debug Paint" command in Visual Studio Code)
          // to see the wireframe for each widget.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headline4,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: manageFlashlight,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}
