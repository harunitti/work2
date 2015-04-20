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
        LAT: 36.748920,
        /**
         * 経度
         * @type {Number}
         */ 
        LNG: 137.021867,
        /**
         * ズーム
         * @type {Number}
         */ 
        ZOOM: 17,
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
         * 標準マーカーの情報ウインドウオフセット位置pixel
         * @type {Number}
         */
        DEFAULT_ICON_OFFSET_HEIGHT: -25
    }
})(this);
