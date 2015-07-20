/**
 * マップ設定
 * 
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function(global) {

    'use strict';
    
    var Map = global.Map || (global.Map = {});

    /**
     * 画像ディレクトリ
     * @type {String}
     */
    var IMAGE_DIR = '/images/';

    Map.Config = {
        /**
         * 緯度
         * @type {Number}
         */ 
        LAT: 36.748885,
        /**
         * 経度
         * @type {Number}
         */ 
        LNG: 137.021863,
        /**
         * マップエレメント
         * @type {String}
         */ 
        MAP_ELEMENT_NAME: 'canvas',
        /**
         * 幅
         * @type {String}
         */ 
        WIDTH: '100%',
        /**
         * 高さ
         * @type {String}
         */ 
        HEIGHT: '100%',
        /**
         * 初期ズーム
         * @type {Number}
         */ 
        ZOOM: 17,
        /**
         * モバイル初期ズーム
         * @type {Number}
         */ 
        MOBILE_ZOOM: 16,
        /**
         * 最小ズーム
         * @type {Number}
         */ 
        MIN_ZOOM: 15,
        /**
         * 最大ズーム
         * @type {Number}
         */ 
        MAX_ZOOM: 19,
        /**
         * モバイル十字移動距離px
         * @type {Number}
         */ 
        MOBILE_MOVE_DISTANCE: 90,
        /**
         * 画像ディレクトリ
         * @type {String}
         */
        IMAGE_DIR: IMAGE_DIR,
        /**
         * アイコンディレクトリ
         * @type {String}
         */
        ICON_DIR: IMAGE_DIR + 'icon/',
        /**
         * 写真ディレクトリ
         * @type {String}
         */
        PHOTO_DIR: IMAGE_DIR + 'photo/',
        /**
         * マップデータURL
         * @type {String}
         */
        MAP_DATA_URL: "/data/map_data.json",
        /**
         * 標準マーカーの情報ウインドウオフセット位置pixel
         * @type {Number}
         */
        DEFAULT_ICON_OFFSET_HEIGHT: -25
    }
})(this);

