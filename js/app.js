/**
 * マップ作成ツール
 * 
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function(global) {

    "use strict";
    
    var Map = global.Map || (global.Map = {});
    
    Map.Tool = function Tool() {};

    Map.Tool.prototype = {
        /**
         * 緯度
         * @type {Number}
         */ 
        lat: 0,
        /**
         * 経度
         * @type {Number}
         */ 
        lng: 0,
        /**
         * ズーム
         * @type {Number}
         */ 
        zoom: 17,
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
         * マウスダウン判定
         * @type {Boolean}
         */ 
        isDown: false,
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
         * モダール
         * @type {Object}
         */ 
        $modal: $('#pointInfoModal'),
        /**
         * 情報ウインドウ表示
         * @type {Boolean}
         */ 
        isOpenInfoWindow: false,
        /**
         * マウスダウン遅延
         * @type {Number}
         */ 
        mouseDownDelay: 400,
        /**
         * 初期処理
         * @param {Object} options
         * @return {Void}
         */ 
        initialize: function (options) {
            this.lat = options.lat;
            this.lng = options.lng;
            this.zoom = options.zoom;
            this.mapDiv = document.getElementById('canvas');
            // モバイル判定
            if (this.isMobile()) {
                var style = this.mapDiv.style;
                style.width = this.MOBILE_WIDTH;
                style.height = this.MOBILE_HEIGHT;
                this.mouseDownDelay = 1500;
            }
            // map作成
            this.addMap();
            // domイベント
            this.addDomEvents();
        },
        /**
         * マップ作成
         * @return {Void}
         */ 
        addMap: function () {
            var self = this;
            // 初期中心地点
            var latlng = new google.maps.LatLng(this.lat, this.lng);// 緯度 経度
            // マップ作成
            var options = this.getMapOptions(latlng);
            this.map = new google.maps.Map(this.mapDiv, options);
            // マップダブルクリック地点にマーカー作成
            google.maps.event.addListener(self.map, 'dblclick', function (e) {
                console.log('map dbclick');
                var latLng = e.latLng;
                var cnt = self.markers.length + 1;
                self.setMaker(latLng, 'マーカー' + cnt);
            });
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
            // 情報ウインドウ表示
            var openInfoWindowBtn = document.getElementById('openInfoWindowBtn');
            google.maps.event.addDomListener(openInfoWindowBtn, 'mousedown', function (e) {
                self.toggleInfoWindow(openInfoWindowBtn);
            });
            // マーカー情報更新キャンセル
            var cancelBtn = document.getElementById('cancelBtn');
            google.maps.event.addDomListener(cancelBtn, 'mousedown', function (e) {
                self.$modal.modal('hide');
            });
            // マーカー情報更新
            var updateBtn = document.getElementById('updateBtn');
            google.maps.event.addDomListener(updateBtn, 'mousedown', function (e) {
                self.updateMarker();
            });
            // マーカー削除
            var deleteBtn = document.getElementById('deleteBtn');
            google.maps.event.addDomListener(deleteBtn, 'mousedown', function (e) {
                self.deleteMarker();
            });
            // 現在地
            var currentBtn = document.getElementById('currentBtn');
            google.maps.event.addDomListener(currentBtn, 'mousedown', function (e) {
                self.current(function(center) {
                    self.map.setCenter(center);
                    //var icon = 'https://dl-web.dropbox.com/get/kojo/pin56.svg?_subject_uid=359804683&w=AABTAEQiFSzqvi7RfIq7-iHSDe9XVw3zpGzqfI3riY9Qow';
                    //self.createMarker(self.map, center, '現在地', icon);
                    self.setMaker(center, '現在地');
                });
            });
            // 保存
            var saveBtn = document.getElementById('saveBtn');
            google.maps.event.addDomListener(saveBtn, 'mousedown', function (e) {
                self.save();
            });
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
         * @param {google.maps.LatLng} latLng
         * @param {String} title
         * @param {String} icon
         * @return {google.maps.Marker} marker
         */ 
        createMarker: function (map, latLng, title, icon) {
            var options = {
                position: latLng,
                map: map,
                draggable: true,
                title: title,
                animation: google.maps.Animation.DROP
            };
            if (icon) {
                options.icon = {url: icon};
            }
            return new google.maps.Marker(options);
        },
        /**
         * マーカー設定
         * @param {google.maps.LatLng} latLng
         * @param {String} title
         * @return {Void}
         */ 
        setMaker: function (latLng, title) {
            var self = this;
            // マーカー追加
            var marker = this.createMarker(this.map, latLng, title);
            // ドラッグ
            google.maps.event.addListener(marker, 'dragstart', function (e) {
                self.isDown = false;
            });
            // マウスダウン
            google.maps.event.addListener(marker, 'mousedown', function (e) {
                console.log('marker mousedown');
                self.isDown = true;
                window.setTimeout(function () {
                    if (!self.isDown) {
                        return;
                    }
                    self.setMarkerData(marker);
                    self.$modal.modal();
                }, self.mouseDownDelay);
            });
            this.markers.push(marker);
        },
        /**
         * マーカー更新
         * @return {Void}
         */ 
        updateMarker: function () {
            var self = this;
            var marker = self.$modal.data('marker');
            if (marker) {
                // 情報ウインドウ削除
                this.eachMarkers(function (marker, idx, target) {
                    if (target === marker) {
                        self.updateMarkerData(marker);
                        self.removeInfoWindow(marker);
                    }
                }, marker);
                this.$modal.modal('hide');
                this.createInfoWindow(marker);
            }
        },
        /**
         * マーカー削除
         * @return {Void}
         */ 
        deleteMarker: function () {
            var marker = this.$modal.data('marker');
            if (marker && window.confirm('削除しますか？')) {
                var idx = this.searchMarkers(marker);
                console.log('delete', idx);
                if (idx !== -1) {
                    marker.setMap(null);
                    this.markers.splice(idx, 1);
                }
                this.$modal.modal('hide');
            }
        },
        /**
         * モダールにマーカー情報表示
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        setMarkerData: function (marker) {
            this.$modal.find('.modal-title').text(marker.title + 'の編集');
            this.$modal.find('#title').val(marker.getTitle());
            this.$modal.find('#lat').val(marker.position.lat());
            this.$modal.find('#lng').val(marker.position.lng());
            this.$modal.find('#info').val(marker.info);
            this.$modal.data('marker', marker);
        },
        /**
         * データ更新
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        updateMarkerData: function (marker) {
            var title = this.$modal.find('#title').val();
            marker.setTitle(title);
            var lat = this.$modal.find('#lat').val();
            var lng = this.$modal.find('#lng').val();
            var latlng = new google.maps.LatLng(lat, lng);// 緯度 経度
            marker.setPosition(latlng);
            marker.info = this.$modal.find('#info').val();
        },
        /**
         * 情報ウインドウ表示管理
         * @param {object} openInfoWindowBtn
         * @return {Void}
         */ 
        toggleInfoWindow: function (openInfoWindowBtn) {
            var self = this;
            if (!this.markers.length) {
                alert('マーカーがありません。マップをダブルクリックして作成してください。');
                return;
            }
            if (!this.isOpenInfoWindow) {
                // 情報ウインドウ作成
                this.eachMarkers(function (marker) {
                    self.createInfoWindow(marker);
                });
                this.isOpenInfoWindow = true;
                openInfoWindowBtn.innerHTML = '情報ウインドウ非表示';
            } else {
                // 情報ウインドウ削除
                this.eachMarkers(function (marker) {
                    self.removeInfoWindow(marker);
                });
                this.isOpenInfoWindow = false;
                openInfoWindowBtn.innerHTML = '情報ウインドウ表示';
            }
        },
        /**
         * 情報ウインドウ作成
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        createInfoWindow: function (marker) {
            this.removeInfoWindow(marker);
            var content = marker.title;
            if (marker.info) {
                content += '<br>' + marker.info;// TODO:HTMLの構造決める
            }
            var infowindow = new google.maps.InfoWindow({
                content: content,
                position: marker.position,
                pixelOffset: new google.maps.Size(0, -25)
            });
            infowindow.open(this.map);
            marker.infowindow = infowindow;
        },
        /**
         * 情報ウインドウ削除
         * @param {google.maps.Marker} marker
         * @return {Void}
         */ 
        removeInfoWindow: function (marker) {
            if (marker.infowindow) {
                marker.infowindow.close();
                marker.infowindow = null;
            }
        },
        /**
         * 現在地
         * @param {Function}
         * @return {Void}
         */ 
        current: function (func) {
            var self = this;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (info) {
                        var lat = info.coords.latitude;
                        var lng = info.coords.longitude;
                        var center = new google.maps.LatLng(lat, lng);
                        func(center);
                    },
                    function (info) {
                        alert('現在地取得エラー' + info.code);
                        return;
                    });
            } else {
                alert('本ブラウザではGeolocationが使えません');
                return;
            }
        },
        /**
         * 保存
         * @return {Void}
         */ 
        save: function () {
            if (!this.markers.length) {
                alert('保存するデータがありません。');
                return;
            }
            var iframe = document.createElement('iframe');
            iframe.frameBorder = '0';
            document.body.appendChild(iframe);

            var form = document.createElement('form');
            form.setAttribute('method', 'post');
            form.setAttribute('action', 'csv_download.php');
            iframe.appendChild(form);

            for (var i = 0; i < this.markers.length; i++) {
                var marker = this.markers[i];
                var position = marker.getPosition();
                var data = [];
                data.push(marker.getTitle());
                data.push(position.lat());
                data.push(position.lng());
                data.push(marker.info);
                form.appendChild(this.createHidden('data[]', data));
            }

            form.submit();
        },
        createHidden: function (name, value) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', name);
            input.setAttribute('value', value);
            return input;
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

