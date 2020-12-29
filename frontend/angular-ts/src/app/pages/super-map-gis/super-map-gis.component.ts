import { Component, OnInit, AfterViewInit } from '@angular/core';

import * as _ from 'lodash';

import { SuperMapGisService } from './super-map-gis.service';

declare var Cesium;

export interface UserPlace {
  name: string;
  companyName: string;
  latitude: number;
  longitude: number;
  centralPoint?: boolean;
}

@Component({
  selector: 'app-super-map-gis',
  templateUrl: './super-map-gis.component.html',
  styleUrls: ['./super-map-gis.component.scss'],
})
export class SuperMapGisComponent implements OnInit, AfterViewInit {

  userPlaceList: UserPlace[];

  viewer: any;
  scene: any;

  lineArr = [];

  constructor(
    private superMapGisService: SuperMapGisService,
  ) {
    this.userPlaceList = [
      {
        name: 'xx',
        companyName: '前端（vue）',
        latitude: 0.6073955666863973,
        longitude: 1.9816311125865307,
      },
      {
        name: '和尚',
        companyName: '后端（node）',
        latitude: 0.6079849247637235,
        longitude: 1.9810105559145992,
        centralPoint: true,
      },
      {
        name: 'Only efforts',
        companyName: '前端（vue）',
        latitude: 0.6075121542802234,
        longitude: 1.9819805572034528,
      },
    ];
  }

  // latitude: 0.6075121542802234
  // longitude: 1.9819805572034528

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.initMap();
  }

  /*
  * 初始化地图
  * */
  initMap(): void {
    /*
    * 创建地图图层
    * */
    this.viewer = new Cesium.Viewer('cesiumContainer', {
      contextOptions: {
        requestWebgl2: true,
      },
      terrainProvider: new Cesium.CesiumTerrainProvider({
        url: 'https://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path',
        requestWaterMask: true,
        requestVertexNormals: true,
        isSct: false,
      }), // 使用地形服务
      'homeButton': true,
      'sceneModePicker': true,
      'navigationHelpButton': false,
      'infoBox': false,
      'vrButton': false,
      'fullscreenButton': false,
      'geocoder': false,
      'showRenderLoopErrors': true,
      'center': {'y': 34.826718, 'x': 114.375556, 'z': 58000.0, 'pitch': -30},
      'minzoom': 1,
      'maxzoom': 50000000,
      'style': {'atmosphere': true, 'lighting': false, 'fog': false, 'testTerrain': false},
      'contextmenu': true,
      'mouseZoom': true,
      'navigation': false,
    });

    this.scene = this.viewer.scene;

    this.scene.globe.depthTestAgainstTerrain = false; // 解决标点显示不全问题
    const imageryLayers = this.viewer.imageryLayers;
    imageryLayers.addImageryProvider(new Cesium.TiandituImageryProvider({
      credit: new Cesium.Credit('天地图全球影像服务     数据来源：国家地理信息公共服务平台 & 四川省测绘地理信息局'),
      token: '95304915c6b414cf00e4a65beca9c8da',
    }))
    // 初始化天地图全球中文注记服务，并添加至影像图层
    const labelImagery = new Cesium.TiandituImageryProvider({
      mapStyle: Cesium.TiandituMapsStyle.CIA_C, // 天地图全球中文注记服务（经纬度投影）
      token: '95304915c6b414cf00e4a65beca9c8da',
    })
    imageryLayers.addImageryProvider(labelImagery);

    this.setAreaBorderLine();

    setTimeout(() => {
      this.setCrewAddress();
    }, 2000)
    this.viewerEvent();
  }

  /*
  * 地图事件
  * */
  viewerEvent(): void {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    handler.setInputAction(e => {
      // 获取点击位置笛卡尔坐标
      const position = this.scene.pickPosition(e.position);
      // 将笛卡尔坐标转化为经纬度坐标
      const cartographic = Cesium.Cartographic.fromCartesian(position);

      const pick = this.viewer.scene.pick(e.position); // 获取点击点位信息

      console.log(pick.id);
      console.log(pick.id.type);
      this.viewer.entities.remove(pick);
      if (pick.id.type === 'crewAddress') {
        this.viewer.entities.remove(pick);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
  }

  /*
  * 放置图标
  * */
  setCrewAddress(): void {
    this.userPlaceList.forEach(item => {
      const longitude = Cesium.Math.toDegrees(item.longitude);
      const latitude = Cesium.Math.toDegrees(item.latitude);

      if (item.centralPoint) {
        this.gotoAddress(longitude, latitude, 20000);
      }

      this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2.61),
        label: {
          show: true,
          text: item.name,
          font: '12px Source Han Sans CN',    // 字体样式
          fillColor: Cesium.Color.WHITE,        // 字体颜色
          backgroundColor: Cesium.Color.RED,    // 背景颜色
          showBackground: false,                // 是否显示背景颜色
          style: Cesium.LabelStyle.FILL,        // label样式
          verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
          pixelOffset: new Cesium.Cartesian2(1, -25),            // 偏移
          eyeOffset: new Cesium.Cartesian3(0, 0, -10),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          // disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        billboard: {
          image: '../../../assets/images/icon-air-city-level1.svg',
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直位置
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
          height: 42,
          width: 100,
          scale: 1,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          // disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        type: 'crewAddress',
      });

      this.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2.61),
        label: {
          show: true,
          text: item.companyName,
          font: '14px Source Han Sans CN',    // 字体样式
          fillColor: Cesium.Color.RED,        // 字体颜色
          backgroundColor: Cesium.Color.RED,    // 背景颜色
          showBackground: false,                // 是否显示背景颜色
          style: Cesium.LabelStyle.FILL,        // label样式
          verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
          pixelOffset: new Cesium.Cartesian2(1, -55),            // 偏移
          eyeOffset: new Cesium.Cartesian3(0, 0, -10),
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          // disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
      });
    })

  }

  /*
  * 绘制行政区划边界线
  * */
  setAreaBorderLine(): void {
    this.superMapGisService.getZhengZhouData()
      .subscribe(res => {
        res.features.forEach(item => {
          this.viewer.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(_.flattenDeep(item.geometry.coordinates)),
              width : 5,
              material : Cesium.Color.WHEAT
            },
            type: 'line',
          });
        })
      })
  }

  /*
  * 定位中心点
  * */
  gotoAddress(longitude, latitude, height, isOrientation?): void {
    const orientation = {
      // 指向
      heading: Cesium.Math.toRadians(0, 0),
      // 视角
      pitch: Cesium.Math.toRadians(-35),
      roll: 0.0,
    }
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      duration: 3,
      orientation: isOrientation ? orientation : {},
    });
  }
}