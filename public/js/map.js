/**
 * マップ
 * 
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function(global) {

    'use strict';
    
    var Map = global.Map || (global.Map = {});
    
    Map.App = function App() {};

    Map.App.prototype = {
        /**
         * 緯度
         * @type {Number}
         */
        lat: Map.Config.LAT,
        /**
         * 経度
         * @type {Number}
         */
        lng: Map.Config.LNG,
        /**
         * ズーム
         * @type {Number}
         */
        zoom: Map.Config.ZOOM,
        /**
         * マップ
         * @type {google.maps.Map}
         */
        map: null,
        /**
         * マーカーリスト
         * @type {Array.<google.maps.Marker>}
         */
        markers: [],
        /**
         * 現在地マーカー
         * @type {google.maps.Marker}
         */
        currentMarker: null,
        /**
         * 画像ディレクトリ
         * @type {String}
         */
        imageDir: Map.Config.IMAGE_DIR,
        /**
         * 写真ディレクトリ
         * @type {String}
         */
        photoDir: Map.Config.PHOTO_DIR,
        /**
         * アイコン画像ディレクトリ
         * @type {String}
         */
        pinDir: Map.Config.ICON_DIR,
        /**
         * モダール
         * @type {Object}
         */
        $settingModal: $('#setting'),
        /**
         * モダール
         * @type {Object}
         */
        $cannelModal: $('#cannel'),
        /**
         * メニュー
         * @type {Object}
         */
        $menu: null,
        /**
         * 地点セレクト
         * @type {Object}
         */
        $pointSelect: null,
        /**
         * データ
         * @type {Array}
         */
        $data: [],
        /**
         * 初期処理
         * @param {Object} options
         * @return {Void}
         */
        initialize: function () {
            this.mapDiv = document.getElementById('canvas');
            this.mapDiv.style.width = this.mapDiv.style.height = '100%';
            // map作成
            this.addMap();
            // navi作成
            this.addNavigation();
            // データ取得
            this.getMapData();
            // モバイルは現在地追跡
            if (this.isMobile()) {
                this.watchCurrent();
            }
        },
        /**
         * マップ作成
         * @return {Void}
         */
        addMap: function () {
            var self = this;
            // 初期中心地点
            var latLng = new google.maps.LatLng(this.lat, this.lng);// 緯度 経度
            // マップ作成
            var options = this.getMapOptions(latLng);
            this.map = new google.maps.Map(this.mapDiv, options);
        },
        /**
         * ナビ作成
         * @return {Void}
         */
        addNavigation: function () {
            var self = this;
            this.$navi = $('<navi>').addClass('navbar navbar-inverse navbar-embossed');
            this.$pointSelect = $('<select>');
            this.$pointSelect.addClass('form-control');
            this.$pointSelect.css('mix-width', '300px');
            this.$pointSelect.attr('id', 'list');
            this.$pointSelect.on('change', function () {
                var marker = $('#list option:selected').data('marker');
                if (marker) {
                    self.removeAllInfoWindow();
                    self.locationMarker(marker);
                }
            });
            this.$navi.append(this.$pointSelect);
        },
        /**
         * マーカー処理
         * @param {Function} func
         * @param {google.maps.Marker} target
         * @return {Void}
         */
        eachMarkers: function (func, target) {
            for (var i = 0; i < this.markers.length; i++) {
                var marker = this.markers[i];
                func(marker, i, target)
            }
        },
        /**
         * マーカー検索
         * @param {google.maps.Marker} target
         * @return {Number} i
         */
        searchMarkers: function (target) {
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i] === target) {
                    return i;
                }
            }
            return -1;
        },
        /**
         * @param {google.maps.Marker} marker
         * @return void
         */
        locationMarker: function (marker) {
            var self = this;
            var latLng = marker.getPosition();
            google.maps.event.addListenerOnce(this.map, 'center_changed', function (e) {
                self.popupMarker(marker);
            });
            this.map.panTo(latLng);
        },
        /**
         * @param {google.maps.Marker} marker
         * @return void
         */
        popupMarker: function (marker) {
            var self = this;
            marker.setAnimation(google.maps.Animation.BOUNCE);
            window.setTimeout(function () {
                marker.setAnimation(null);
                self.createInfoWindow(marker);
                self.bringToFront(marker);
            }, 1500);
        },
        /**
         * CSV取得
         * @return void
         */
        getMapData: function () {
            var self = this;
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "/data/map_data.json",
                success: function (data) {
                    self.setNavigation(data)
                }
            });
        },

        /**
         * ナビゲーション設定
         * @param {google.maps.LatLng} data
         * @return {Void}
         */
        setNavigation: function (data) {
            if (!data.length) {
                return;
            }
            var self = this;
            this.$data = data; 
            // タイトル
            self.$titleBtn = $("<button>").addClass("btn btn-inverse category");
            self.$navi.append(self.$titleBtn);
            self.setMapData(data[0].name, data[0].data);
            // カテゴリ
            var $cannelBtn = $('<button>').addClass('btn btn-success').text('カテゴリ');
            $cannelBtn.on('mousedown', function () {
                self.$cannelModal.modal();
            });
            // Info
            self.$navi.append($cannelBtn);
            var $infoBtn = $('<button>').addClass('btn btn-info').text('Info');
            $infoBtn.on('mousedown', function () {
                self.$settingModal.modal();
            });
            self.$navi.append($infoBtn);
            self.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(self.$navi[0]);
        },
        /**
         * マップデータ反映
         * @param {String} category
         * @param {Array} data
         * @return {Void}
         */
        setMapData: function (category, data) {
            this.$titleBtn.text(category);
            this.$pointSelect.html('').append($('<option>').text('メニュー'));
            for (var i = 0; i < data.length; i++) {
                var title   = data[i]['title'];
                var lat     = data[i]['lat'];
                var lng     = data[i]['lng'];
                var info    = data[i]['info'];
                var pin     = data[i]['pin'];
                var photo   = data[i]['photo'];
                var latLng  = new google.maps.LatLng(lat, lng);
                var marker  = this.setMaker(category, title, latLng, info, pin, photo);
                var $option = $("<option>").text(title).data('marker', marker);
                this.$pointSelect.append($option);// data属性使いたいので1回ずつappend
            }
        },
        /**
         * マップオブション取得
         * @param {google.maps.LatLng} latLng
         * @return {Object} options
         */
        getMapOptions: function (latLng) {
            return {
                zoom: this.zoom,
                center: latLng,
                disableDoubleClickZoom: true,
                draggable: true,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControl: false,
                streetViewControl: false,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                panControl: false
            }
        },
        /**
         * マーカー作成
         * @param {google.maps.Map} map
         * @param {String} category
         * @param {String} title
         * @param {google.maps.LatLng} latLng
         * @param {String} info
         * @param {Object} pin
         * @param {Object} photo
         * @return {google.maps.Marker} marker
         */ 
        createMarker: function (map, category, title, latLng, info, pin, photo) {
            var options = {
                map: map,
                category: category,
                title: title,
                position: latLng,
                pin: '',
                info: '',
                photo: '',
                draggable: false,
                animation: google.maps.Animation.DROP
            };
            if (info) {
                options.info = info;
            }
            if (pin.name) {
                var path = this.pinDir + pin.name;
                options.icon = {url: path};
                options.pin = pin;
                options.iconOffsetHeight = - pin.size.height;
            } else {
                options.iconOffsetHeight = Map.Config.DEFAULT_ICON_OFFSET_HEIGHT// デフォルトピン用
            }
            if (photo) {
                options.photo = photo;
            }
            return new google.maps.Marker(options);
        },
        /**
         * マーカー設定
         * @param {String} category
         * @param {String} title
         * @param {google.maps.LatLng} latLng
         * @param {String} info
         * @param {Object} pin
         * @param {Object} photo
         * @return {google.maps.Marker} marker
         */ 
        setMaker: function (category, title, latLng, info, pin, photo) {
            var self = this;
            // マーカー追加
            var marker = this.createMarker(this.map, category, title, latLng, info, pin, photo);
            // マウスダウン
            google.maps.event.addListener(marker, 'mousedown', function (e) {
                if (!marker.infoWindow) {
                    self.createInfoWindow(marker);
                    self.bringToFront(marker);
                } else {
                    self.removeInfoWindow(marker);
                }
            });
            // マウスオーバー
            /*
            google.maps.event.addListener(marker, 'mouseover', function (e) {
                if (marker.infoWindow) {
                    self.bringToFront(marker);
                }
            });
            */
            this.markers.push(marker);
            return marker;
        },
        /**
         * マーカー最前面へ
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        bringToFront: function (marker) {
            var self = this;
            this.eachMarkers(function (marker, i, target) {
                if (!marker.infoWindow) {
                    return;
                }
                if (marker === target) {
                    marker.infoWindow.setZIndex(self.markers.length);
                } else {
                    marker.infoWindow.setZIndex(0);
                }
            }, marker);
        },
        /**
         * 情報ウインドウ作成
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        createInfoWindow: function (marker) {
            var self = this;
            this.removeInfoWindow(marker);
            if (marker.photo.name) {
                var path = this.photoDir + '/' + marker.photo.name;
                var img = new Image();
                img.src = path;
                img.onload = function () {
                    self.setInfoWindow(marker, path);
                }
            } else {
                this.setInfoWindow(marker, null);
            }
        },
        /**
         * 情報ウインドウ作成
         * @param {google.maps.Marker} marker
         * @param {String} path
         * @return {Void}
         */ 
        setInfoWindow: function (marker, path) {
            var content = '';
            content += '<div class="infoWin">';
            content += '<div><strong>';
            content += marker.title;
            content += '</strong></div>';
            content += '<div>';
            content += marker.info;
            content += '</div>';
            if (marker.photo.name) {
                content += '<img src="' + path + '">';
            }
            content += '</div>';
            var infoWindow = new google.maps.InfoWindow({
                content: content,
                position: marker.position,
                pixelOffset: new google.maps.Size(0, marker.iconOffsetHeight)
            });
            infoWindow.open(this.map);
            marker.infoWindow = infoWindow;
        },
        /**
         * 情報ウインドウ削除
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        removeInfoWindow: function (marker) {
            if (marker.infoWindow) {
                marker.infoWindow.close();
                marker.infoWindow = null;
            }
        },
        /**
         * 情報ウインドウ削除
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        removeAllInfoWindow: function () {
            var self = this;
            this.eachMarkers(function (marker) {
                if (marker.infoWindow) {
                    self.removeInfoWindow(marker);
                }
            });
        },
        /**
         * 現在地追跡
         * @return {Void}
         */ 
        watchCurrent: function () {
            var self = this;
            this.watchCurrentPosition(function(center) {
                if (!self.currentMarker) {
                    self.setCurrentMarker(center);
                } else {
                    self.currentMarker.setPosition(center);
                }
            });
        },
        /**
         * 現在地追跡
         * @param {Function} func
         * @return {Void}
         */ 
        watchCurrentPosition: function (func) {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(
                    function (info) {
                        var lat = info.coords.latitude;
                        var lng = info.coords.longitude;
                        var center = new google.maps.LatLng(lat, lng);
                        func(center);
                    },
                    function (info) {
                        //alert('現在地取得エラー' + info.code);
                        return;
                    },
                    {enableHighAccuracy: true, timeout: 6000, maximumAge: 600000}
                );
            } else {
                //alert('本ブラウザではGeolocationが使えません');
                return;
            }
        },
        /**
         * 現在地表示
         * @param {google.maps.LatLng} latLng
         * @return {Void}
         */ 
        setCurrentMarker: function(latLng) {
            // define our custom marker image
            var image = new google.maps.MarkerImage(
                this.imageDir + 'bluedot.png',
                null, // size
                null, // origin
                new google.maps.Point(8, 8), // anchor (move to center of marker)
                new google.maps.Size(17, 17) // scaled size (required for Retina display icon)
            );
            var options = {
                map: this.map,
                position: latLng,
                icon: image,
                optimized: false,
                title: '現在地',
                visible: true
            };
            this.currentMarker = new google.maps.Marker(options);
        },
        /**
         * モバイル判定
         * @return {Boolean}
         */ 
        isMobile: function () {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf('iPhone') != -1 ||
                userAgent.indexOf('iPad') != -1 ||
                userAgent.indexOf('iPod') != -1 ||
                userAgent.indexOf('Android') != -1) {
                return true;
            }
            return false;
        }
    }
})(this);

