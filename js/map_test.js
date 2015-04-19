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
         * 初期処理
         * @param {Object} options
         * @return {Void}
         */ 
        initialize: function () {
            this.mapDiv = document.getElementById('canvas');
            // モバイル判定
            var mobile = this.isMobile();
            if (mobile) {
                var style = this.mapDiv.style;
                style.width = Map.Config.MOBILE_WIDTH;
                style.height = Map.Config.MOBILE_HEIGHT;
            }
            // map作成
            this.addMap();
            // domイベント
            this.addDomEvents();
            // データ取得
            this.getMapData();
            // 現在地追跡
            if (mobile) {
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
            /*
            var $menu = $('div');
            $menu.attr('id', 'control');
            var $select = $('select');
            $select.addClass('hide');
            $select.attr('id', 'list');
            //$menu.append($select);
            self.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push($menu[0]);
            */
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
         * Domイベント設定
         * @return {Void}
         */ 
        addDomEvents: function () {
            var self = this;
            $(document).on('click', '.category', function () {
                var category = $(this).text();
                if ($(this).data("added")) {
                    self.eachMarkers(function(marker) {
                        // TODO カテゴリ指定
                        var toggle = !marker.getVisible();
                        marker.setVisible(toggle);
                        if (!toggle) {
                            self.removeAllInfoWindow();
                        }
                    });
                } else {
                    var datas = $(this).data('info');
                    for (var i = 0; i < datas.length; i++) {
                        var title    = datas[i][0];
                        var lat      = datas[i][1];
                        var lng      = datas[i][2];
                        var info     = datas[i][3];
                        var pin      = datas[i][4];
                        var photo    = datas[i][5];
                        var latLng   = new google.maps.LatLng(lat, lng);
                        var marker   = self.setMaker(category, title, latLng, info, pin, photo);
                        if (title) {
                            var $option = $("<option>").text(title).addClass('btn btn-default title').data('marker', marker);
                            $("#list").append($option);// data属性使いたいので1回ずつappend
                        }
                    }
                    if (datas.length) {
                        $("#list").removeClass('hide');
                    }
                    $(this).data("added", true);
                }
            });
            $("#list").on('change', function () {
                var marker = $('#list option:selected').data('marker');
                self.removeAllInfoWindow();
                self.locationMarker(marker);
            });
        },
        /**
         * @param {google.maps.Marker} marker
         * @return void
         */
        locationMarker: function (marker) {
            var self = this;
            var latLng = marker.getPosition();
            this.map.panTo(latLng);
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
                url: "get_map_data.php",
                success: function (data) {
                    if (data.length) {
                        for (var i=0;i < data.length;i ++) {
                            var title = data[i].name;
                            var info = data[i].data;
                            var $btn = $("<button>")
                                            .text(title)
                                            .addClass("btn btn-default category")
                                            .data("info", info);
                            
                            $("#menu").append($btn);
                        }
                    }
                }
            });
            // TODO 画像のサイズ取得して吹き出しの表示位置に指定する。
            // TODO 現状、利長くんアイコンの頭が隠れている。
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
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true
            }
        },
        /**
         * マーカー作成
         * @param {google.maps.Map} map
         * @param {String} category
         * @param {String} title
         * @param {google.maps.LatLng} latLng
         * @param {String} info
         * @param {String} pin
         * @param {String} photo
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
                animation: google.maps.Animation.DROP,
                iconOffsetHeight: Map.Config.DEFAULT_ICON_OFFSET_HEIGHT// デフォルトピン用
            };
            if (info) {
                options.info = info;
            }
            if (pin) {
                var path = this.pinDir + pin;
                options.icon = {url: path};
                options.pin = pin;
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
         * @param {String} pin
         * @param {String} photo
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
            this.removeInfoWindow(marker);
            var content = '';
            content += '<div class="infoWin">';
            content += '<div><strong>';
            content += marker.title;
            content += '</strong></div>';
            content += '<div>';
            content += marker.info;
            content += '</div>';
            if (marker.photo) {
                content += '<img src="' + this.photoDir + '/' + marker.photo + '">';
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

