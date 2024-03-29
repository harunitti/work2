/**
 * マップ作成ツール
 *
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function(global) {

    'use strict';

    var Map = global.Map || (global.Map = {});

    Map.Tool = function Tool() {};

    Map.Tool.prototype = {
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
         * CSVテキストエリア
         * @type {Object}
         */
        $csv: $("#csv"),
        /**
         * 情報ウインドウ表示
         * @type {Boolean}
         */
        isInfoWindowOpen: false,
        /**
         * マウスダウン遅延
         * @type {Number}
         */
        mouseDownDelay: Map.Config.MOUSE_DOWN_DELAY_PC,
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
         * 写真セレクト
         * @type {Object}
         */
        $photoSelect: $("#photo"),
        /**
         * アイコンセレクト
         * @type {Object}
         */
        $pinSelect: $("#pin"),
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
                this.mouseDownDelay = Map.Config.MOUSE_DOWN_DELAY_MOBILE;
                var saveBtn = document.getElementById('saveBtn');
                saveBtn.style.display = 'none';
            } else {
                var currentBtn = document.getElementById('currentBtn');
                currentBtn.style.display = 'none';
            }
            console.log("init");
            // map作成
            this.addMap();
            // domイベント
            this.addDomEvents();
            // 画像一覧取得
            this.getImageList();
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
            // マップダブルクリック地点にマーカー作成
            google.maps.event.addListener(self.map, 'dblclick', function (e) {
                var latLng = e.latLng;
                self.addMarker(latLng);
            });
        },
        /**
         * マーカー作成
         * @param {google.maps.LatLng} latLng
         * @return {Void}
         */
        addMarker: function (latLng) {
            var cnt = this.markers.length + 1;
            var title = 'マーカー' + cnt;
            this.setMaker(title, latLng);
            this.updateCSV();
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
                self.updateCSV();
            });
            // マーカー削除
            var deleteBtn = document.getElementById('deleteBtn');
            google.maps.event.addDomListener(deleteBtn, 'mousedown', function (e) {
                self.deleteMarker();
                self.updateCSV();
            });
            // 現在地に打つ
            var currentBtn = document.getElementById('currentBtn');
            google.maps.event.addDomListener(currentBtn, 'mousedown', function (e) {
                if (self.currentMarker) {
                    var latLng = self.currentMarker.getPosition();
                    self.addMarker(latLng);
                }
            });
            // 保存
            var saveBtn = document.getElementById('saveBtn');
            google.maps.event.addDomListener(saveBtn, 'mousedown', function (e) {
                self.save();
            });
            // 復元
            var restoreBtn = document.getElementById('restoreBtn');
            google.maps.event.addDomListener(restoreBtn, 'mousedown', function (e) {
                self.restore();
            });
            // 全選択
            this.$csv.mousedown(function() {
                console.log("focus");
                if (!self.$csv.is(":focus")) {
                    self.$csv.select().focus();
                    return false;
                }
            });
        },
        /**
         * 画像取得
         * @return void
         */
        getImageList: function () {
            console.log("getImageList");
            var self = this;
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "get_image_list",
                success: function (data) {
                    console.log(data);
                    var i, filename, options = '';
                    for (i = 0; i < data[0].length; i++) {
                        filename = data[0][i].name;
                        options += '<option value="' + filename + '">' + filename + '</option>';
                    }
                    self.$photoSelect.append(options);
                    options = '';
                    var w, h;
                    for (i = 0; i < data[1].length; i++) {
                        filename = data[1][i].name;
                        w = data[1][i].width;
                        h = data[1][i].height;
                        options += '<option value="' + filename + '" data-width="' + w +  '" data-height="' + h + '">' + filename + '</option>';
                    }
                    self.$pinSelect.append(options);
                }
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
         * @param {String} title
         * @param {google.maps.LatLng} latLng
         * @param {String} info
         * @param {String} pin
         * @param {String} photo
         * @return {google.maps.Marker} marker
         */
        createMarker: function (map, title, latLng, info, pin, photo) {
            var options = {
                map: map,
                title: title,
                position: latLng,
                pin: '',
                info: '',
                photo: '',
                draggable: true,
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
         * @param {String} title
         * @param {google.maps.LatLng} latLng
         * @param {String} info
         * @param {String} pin
         * @param {String} photo
         * @return {Void}
         */
        setMaker: function (title, latLng, info, pin, photo) {
            var self = this;
            // マーカー追加
            var marker = this.createMarker(this.map, title, latLng, info, pin, photo);
            // ドラッグ前
            google.maps.event.addListener(marker, 'dragstart', function (e) {
                self.isDown = false;
            });
            // ドラッグ後
            google.maps.event.addListener(marker, 'dragend', function (e) {
                // 緯度経度変更を更新
                self.updateCSV();
                if (marker.infoWindow) {
                    self.createInfoWindow(marker);
                }
            });
            // オーバー
            google.maps.event.addListener(marker, 'mouseover', function (e) {
                if (marker.infoWindow) {
                    self.eachMarkers(function(marker, i, target) {
                        if (!marker.infoWindow) {
                            return;
                        }
                        if (marker === target) {
                            marker.infoWindow.setZIndex(self.markers.length);
                        } else {
                            marker.infoWindow.setZIndex(0);
                        }
                    }, marker);
                }
            });
            // マウスダウン
            google.maps.event.addListener(marker, 'mousedown', function (e) {
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
                if (idx !== -1) {
                    this.removeInfoWindow(marker);
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
            this.$modal.find('#photo').val(marker.photo);
            this.$modal.find('#pin').val(marker.pin);
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
            marker.photo = this.$modal.find('#photo').val();
            marker.pin = this.$modal.find('#pin').val();
            var iconHeight = this.$modal.find('#pin option:selected').data('height');
            var iconUrl = null;
            if (marker.pin) {
                iconUrl =  this.pinDir + marker.pin;
                marker.iconOffsetHeight = - (iconHeight);
            } else {
                marker.iconOffsetHeight = Map.Config.DEFAULT_ICON_OFFSET_HEIGHT;
            }
            marker.setIcon(iconUrl);
            this.createInfoWindow(marker);
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
            if (!this.isInfoWindowOpen) {
                // 情報ウインドウ作成
                this.eachMarkers(function (marker) {
                    self.createInfoWindow(marker);
                });
                this.isInfoWindowOpen = true;
                openInfoWindowBtn.innerHTML = '情報ウインドウ非表示';
            } else {
                // 情報ウインドウ削除
                this.eachMarkers(function (marker) {
                    self.removeInfoWindow(marker);
                });
                this.isInfoWindowOpen = false;
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
                        alert('現在地取得エラー' + info.code);
                        return;
                    },
                    {enableHighAccuracy: true, timeout: 6000, maximumAge: 600000}
                );
            } else {
                alert('本ブラウザではGeolocationが使えません');
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
         * 保存
         * @return {Void}
         */
        updateCSV: function () {
            var csv = '';
            this.eachMarkers(function (marker) {
                var position = marker.getPosition();
                var data = [];
                data.push(marker.getTitle());
                data.push(position.lat());
                data.push(position.lng());
                data.push(marker.info);
                data.push(marker.pin);
                data.push(marker.photo);
                csv += data.join(',') + '\n';
            });
            this.$csv.val(csv);
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
            var self = this;
            var iframe = document.createElement('iframe');
            iframe.frameBorder = '0';
            document.body.appendChild(iframe);

            var form = document.createElement('form');
            form.setAttribute('method', 'post');
            form.setAttribute('action', 'csv_download');
            iframe.appendChild(form);

            this.eachMarkers(function (marker) {
                var position = marker.getPosition();
                var data = [];
                data.push(marker.getTitle());
                data.push(position.lat());
                data.push(position.lng());
                data.push(marker.info);
                data.push(marker.pin);
                data.push(marker.photo);
                form.appendChild(self.createHidden('data[]', data));
            });

            form.submit();

        },
        /**
         * 復元
         * @return {Void}
         */
        restore: function () {
            var self = this;
            // 削除
            this.eachMarkers(function (marker) {
                if (marker) {
                    self.removeInfoWindow(marker);
                    marker.setMap(null);
                }
            });
            this.markers = [];
            var csv = this.$csv.val();
            var datas = csv.split('\n');
            for (var i=0;i < datas.length; i++) {
                var data = [];
                if (datas[i] != '') {
                    data = datas[i].split(',');
                    var title   = data[0];
                    var lat     = data[1];
                    var lng     = data[2];
                    var info    = data[3];
                    var pin     = data[4];
                    var photo   = data[5];
                    var latLng = new google.maps.LatLng(lat, lng);// 緯度 経度
                    var marker = this.setMaker(title, latLng, info, pin, photo);
                }
            }
        },
        /**
         * input hidden作成
         * @param {String} name
         * @param {String} value
         * @return {Object} input
         */
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

