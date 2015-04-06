/**
 * マップ作成ツール設定
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
         * モバイル幅
         * @type {String}
         */ 
        MOBILE_WIDTH: '100%',
        /**
         * モバイル高さ
         * @type {String}
         */ 
        MOBILE_HEIGHT: '420px',
        /**
         * PC長押し判定ミリ秒
         * @type {Number}
         */ 
        MOUSE_DOWN_DELAY_PC: 400,
        /**
         * モバイル長押し判定ミリ秒
         * @type {Number}
         */ 
        MOUSE_DOWN_DELAY_MOBILE: 1500,
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
        PHOTO_DIR: IMAGE_DIR + 'photo/'
    }
})(this);

