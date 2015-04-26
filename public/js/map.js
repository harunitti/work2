/**
 * マップ
 *
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function (global) {

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
        $infoModal: $('#infoModal'),
        /**
         * モダール
         * @type {Object}
         */
        $settingModal: $('#settingModal'),
        /**
         * モダール
         * @type {Object}
         */
        $photoModal: $('#largePhotoModal'),
        /**
         * モダール
         * @type {Object}
         */
        $slideModal: $('#slideshowModal'),
        /**
         * ナビ
         * @type {Object}
         */
        $navi: null,
        /**
         * ナビボタングループ
         * @type {Object}
         */
        $naviBtnGroup: null,
        /**
         * 地点セレクト
         * @type {Object}
         */
        $pointSelect: null,
        /**
         * データ
         * @type {Array}
         */
        data: [],
        /**
         * 選択中の情報
         * @type {Object}
         */
        selectedInfo: {scrollTop: 0},
        /**
         * ツールチップ表示
         * @type {Boolean}
         */
        isToolTipOn: false,
        /**
         * マップ変更完了
         * @type {Boolean}
         */
        isMapChangeEnd: true,
        /**
         * 初期処理
         * @param {Object} options
         * @return {Void}
         */
        initialize: function () {
            this.mapDiv = document.getElementById(Map.Config.MAP_ELEMENT_NAME);
            this.mapDiv.style.width  = Map.Config.WIDTH;
            this.mapDiv.style.height = Map.Config.HEIGHT;
            // map作成
            this.addMap();
            // mapイベント
            this.addMapEvents();
            // navi作成
            this.addNavigation();
            // データ取得
            this.getMapData();
            // イベント
            this.addDomEvents();
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
            // 初期中心地点
            var latLng = new google.maps.LatLng(this.lat, this.lng);// 緯度 経度
            // マップ作成
            var options = this.getMapOptions(latLng);
            this.map = new google.maps.Map(this.mapDiv, options);
        },
        /**
         * マップイベント
         * @return {Void}
         */
        addMapEvents: function () {
            var self = this;
            // 遅延処理
            var delayFunc = function () {
                setTimeout(function () {
                    self.isMapChangeEnd = true;
                    self.changeMapEnd();
                }, 500);
            };
            // ドラッグ開始
            google.maps.event.addListener(this.map, 'dragstart', function (e) {
                console.log('dragstart');
                self.isMapChangeEnd = false;
                self.removeToolTips();
            });
            // ドラッグ完了
            google.maps.event.addListener(this.map, 'dragend', function (e) {
                delayFunc();
            });
            // ズーム変更
            google.maps.event.addListener(this.map, 'zoom_changed', function (e) {
                console.log('zoom_changed');
                self.removeToolTips();
                delayFunc();
            });
        },
        /**
         * マップ変更後処理
         * @return {Void}
         */
        changeMapEnd: function () {
            console.log('changeMapEnd', this.isMapChangeEnd, this.isToolTipOn);
            if (this.isMapChangeEnd) {
                this.addToolTips();
            }
        },
        /**
         * マップオブション取得
         * @param {google.maps.LatLng} latLng
         * @return {Object} options
         */
        getMapOptions: function (latLng) {
            return {
                zoom: Map.Config.ZOOM,
                minZoom: Map.Config.MIN_ZOOM,
                maxZoom: Map.Config.MAX_ZOOM,
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
         * ナビ作成
         * @return {Void}
         */
        addNavigation: function () {
            var self = this;
            this.$navi = $('<navi>').addClass('navbar navbar-inverse navbar-embossed').zIndex(1);
            this.$pointSelect = $('<select>');
            this.$pointSelect.addClass('form-control');
            this.$pointSelect.attr('id', 'pointSelect');
            this.$pointSelect.on('change', function () {
                var marker = $('#pointSelect option:selected').data('marker');
                if (marker) {
                    self.removeAllInfoWindow();
                    self.locationMarker(marker);
                }
            });
            this.$naviBtnGroup = $('<div>').addClass('btn-group');
            this.$navi.append(this.$pointSelect);
            this.$navi.append(this.$naviBtnGroup);
        },
        /**
         * 地図データ取得
         * @return void
         */
        getMapData: function () {
            var self = this;
            $.ajax({
                type: "GET",
                dataType: "json",
                url: Map.Config.MAP_DATA_URL,
                success: function (data) {
                    self.setNavigation(data)
                }
            });
        },
        /**
         * domイベント
         * @return {Void}
         */
        addDomEvents: function () {
            var self = this;
            // 画像拡大表示
            $(document).on('mousedown', '.view-large', function () {
                var path = $(this).data('path');
                var title = $(this).data('title');
                var info = $(this).data('info');
                if (path) {
                    self.$photoModal.find('.modal-title').text(title);
                    self.$photoModal.find('.large-photo').prop('src', path);
                    self.$photoModal.find('.info').html(info);
                    self.$photoModal.modal();
                }
            });
            // スライドショーの画像選択
            $(document).on('mousedown', '.slide-photo', function () {
                var marker = $(this).data('marker');
                if (marker) {
                    self.removeAllInfoWindow();
                    self.locationMarker(marker);
                }
                self.selectedInfo.scrollTop = self.$slideModal.scrollTop();
                self.$slideModal.modal('hide');
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
            this.data = data;
            // ボタン配置
            this.setNavigationButton();
            this.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(self.$navi[0]);
            // 初期表示設定
            this.setMapData(data[0].name, data[0].data);
            // カテゴリー機能設定
            this.setCategoryModal(data);
        },
        /**
         * ナビゲーションボタン設定
         * @return {Void}
         */
        setNavigationButton: function () {
            var self = this;
            // タイトル
            this.$titleBtn = $("<button>").addClass("btn btn-inverse category").css('font-size', '0.8em');
            this.$naviBtnGroup.append(this.$titleBtn);
            // 設定ボタン
            var $settingBtn = $('<button>').addClass('btn btn-warning').prop('title', '設定');
            $settingBtn.append($('<span class="fui-gear" aria-hidden="true"></span>'));
            $settingBtn.on('mousedown', function () {
                self.$settingModal.modal();
            });
            this.$naviBtnGroup.append($settingBtn);
            // 写真一覧ボタン
            var $slideShowBtn = $('<button>').addClass('btn btn-danger').prop('title', '写真一覧');
            $slideShowBtn.append($('<span class="fui-image" aria-hidden="true"></span>'));
            $slideShowBtn.on('mousedown', function () {
                self.slideView();
            });
            this.$naviBtnGroup.append($slideShowBtn);
            // Infoボタン
            var $infoBtn = $('<button>').addClass('btn btn-primary').prop('title', 'Info');
            $infoBtn.append($('<span class="fui-info-circle" aria-hidden="true"></span>'));
            $infoBtn.on('mousedown', function () {
                self.$infoModal.modal();
            });
            this.$naviBtnGroup.append($infoBtn);
        },
        /**
         * カテゴリ設定
         * @param {Array} data
         * @return {Void}
         */
        setCategoryModal: function (data) {
            var self = this;
            for (var i = 0; i < data.length; i++) {
                var categoryName = data[i].name;
                var $label = $('<label>').addClass('radio');
                var $radio = $('<input type="radio">')
                    .prop('name', 'category')
                    .data('toggle', 'radio')
                    .val(i)
                    .attr('id', categoryName + i);
                if (i == 0) {
                    $radio.attr('checked', 'checked');
                }
                $label
                    .text(categoryName)
                    .attr('for', categoryName + i)
                    .prepend($radio);
                self.$settingModal.find('#categoryList').append($label);
            }
            $(':radio').radiocheck();
            // カテゴリ選択
            $('[name="category"]').on('change', function () {
                var no = $('input[name="category"]:checked').val();
                self.removeAllMarker();
                self.markers = [];
                self.setMapData(data[no].name, data[no].data);
                self.$settingModal.modal('hide');
                self.selectedInfo.scrollTop = 0;
                // スライドショー機能設定
                self.setSlideShowModal();
                self.addToolTips();
            });
            // スライドショー機能設定
            this.setSlideShowModal();
            this.addToolTips();
        },
        /**
         * スライドビュー
         * @return {Void}
         */
        slideView: function () {
            this.$slideModal.animate({
                scrollTop: this.selectedInfo.scrollTop
            }, "fast", "swing");
            this.$slideModal.modal();
        },
        /**
         * カテゴリ設定
         * @return {Void}
         */
        setSlideShowModal: function () {
            var self = this;
            this.$slideModal.find('#slideList').html('');
            this.eachMarkers(function (marker) {
                if (!marker.photo.name) {
                    return;
                }
                var path = self.photoDir + marker.photo.name;
                var $img = $('<img>').prop('src', path)
                    .addClass('slide-photo img-responsive img-thumbnail')
                    .data('marker', marker)
                    .css('cursor', 'pointer')
                    .prop('title', marker.title);
                self.$slideModal.find('#slideList').append($img);
            });
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
                var title = data[i]['title'];
                var lat = data[i]['lat'];
                var lng = data[i]['lng'];
                var info = data[i]['info'];
                var pin = data[i]['pin'];
                var photo = data[i]['photo'];
                var latLng = new google.maps.LatLng(lat, lng);
                var marker = this.setMaker(category, title, latLng, info, pin, photo);
                var $option = $("<option>").text(title).data('marker', marker);
                this.$pointSelect.append($option);// data属性使いたいので1回ずつappend
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
                options.icon = new google.maps.MarkerImage(path, null, null, null, new google.maps.Size(pin.size.width, pin.size.height))
                options.pin = pin;
                options.iconOffsetHeight = -pin.size.height;
            } else {
                options.iconOffsetHeight = Map.Config.DEFAULT_ICON_OFFSET_HEIGHT;// デフォルトピン用
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
            this.markers.push(marker);
            return marker;
        },
        /**
         * 全ツールチップ非表示
         * @return {Void}
         */
        removeToolTips: function () {
            var self = this;
            this.eachMarkers(function (marker) {
                self.removeToolTip(marker);
            });
        },
        /**
         * ツールチップ非表示
         * @param {google.maps.Marker} marker
         * @return {Void}
         */
        removeToolTip: function (marker) {
            if (marker.toolTip) {
                marker.toolTip.setMap(null);
                marker.toolTip = null;
            }
        },
        /**
         * ツールチップ表示
         * @return {Void}
         */
        addToolTips: function () {
            var self = this;
            this.eachMarkers(function (marker) {
                if (!marker.toolTip) {
                    marker.toolTip = new Map.Tooltip(self.map, marker);
                }
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
         * 全マーカー削除
         * @return {Void}
         */
        removeAllMarker: function () {
            var self = this;
            this.eachMarkers(function (marker) {
                self.removeInfoWindow(marker);
                self.removeToolTip(marker);
                marker.setMap(null);
            });
        },
        /**
         * 指定マーカー位置が中心になるように移動
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
         * 指定マーカージャンプ
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
                // target以外を下へ
                if (marker != target) {
                    marker.infoWindow.setZIndex(0);
                    marker.setZIndex(0);
                } else {
                    marker.setZIndex(self.markers.length);
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
            var zIndex = this.markers.length;
            if (marker.photo.name) {
                var path = this.photoDir + marker.photo.name;
                var img = new Image();
                img.src = path;
                img.onload = function () {
                    self.setInfoWindow(marker, path, zIndex);
                }
            } else {
                this.setInfoWindow(marker, null, zIndex);
            }
        },
        /**
         * 情報ウインドウ作成
         * @param {google.maps.Marker} marker
         * @param {String} path
         * @param {Number} zIndex
         * @return {Void}
         */
        setInfoWindow: function (marker, path, zIndex) {
            var self = this;
            var content = '';
            content += '<div class="infoWin">';
            content += '<div><strong>';
            content += marker.title;
            content += '</strong></div>';
            content += '<div>';
            content += marker.info;
            content += '</div>';
            if (path) {
                content += '<div class="view-large" src="' + path + '" data-path="' + path + '" data-title="' + marker.title + '" data-info="' + marker.info + '">';
                content += '<a href="javascript:void(0);" >大きいサイズで見る</a><br>';
                content += '<img src="' + path + '">';
                content += '</div>';
            }
            content += '</div>';
            var infoWindow = new google.maps.InfoWindow({
                content: content,
                position: marker.position,
                pixelOffset: new google.maps.Size(0, marker.iconOffsetHeight),
                zIndex: zIndex// 最前面
            });
            infoWindow.open(this.map);
            google.maps.event.addListenerOnce(infoWindow, 'closeclick', function (e) {
                self.removeInfoWindow(marker);
            });
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
            this.watchCurrentPosition(function (center) {
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
        setCurrentMarker: function (latLng) {
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