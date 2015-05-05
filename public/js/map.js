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
         * データ
         * @type {Array}
         */
        data: [],
        /**
         * スクロール位置記録
         * @type {Object}
         */
        selectedScrollTop: 0,
        /**
         * スクロール位置記録
         * @type {Object}
         */
        selectedMarker: null,
        /**
         * センター位置記録
         * @type {Object}
         */
        selectedCenter: null,
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
            if (this.isSmartPhone()) {
                // モバイルコントロール
                this.setMobileControl();
            }
            // モバイル
            if (this.isMobile()) {
                // 現在地追跡
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
         * TODO: ドラッグ完了の時は消さなくていいものは消さず、新たに表示するものだけ表示するようにする
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
            // ドラッグ完了
            google.maps.event.addListener(this.map, 'dragend', function (e) {
                self.isMapChangeEnd = false;
                self.removeToolTips();
                delayFunc();
            });
            // ズーム変更
            google.maps.event.addListener(this.map, 'zoom_changed', function (e) {
                self.isMapChangeEnd = false;
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
            // ズーム
            if (this.isMobile()) {
                this.zoom = Map.Config.MOBILE_ZOOM;
            }
            // ドラッグ
            var draggable = true;
            if (this.isSmartPhone()) {
                // iPhone禁止
                draggable = false;
            }
            var options = {
                zoom: this.zoom,
                minZoom: Map.Config.MIN_ZOOM,
                maxZoom: Map.Config.MAX_ZOOM,
                center: latLng,
                disableDoubleClickZoom: true,
                draggable: draggable,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                panControl: false
            };
            return options;
        },
        /**
         * 選択中のマーカーを中心にする
         * @return {Void}
         */
         setCenterToMarker: function () {
            if (this.selectedMarker) {
                var position = this.selectedMarker.getPosition();
                this.map.setCenter(position);
                if (this.selectedMarker.infoWindow) {
                    this.createInfoWindow(this.selectedMarker);
                }
            }
        },
        /**
         * ナビ作成
         * @return {Void}
         */
        addNavigation: function () {
            var self = this;
            this.$navi = $('<div>').addClass('btn-toolbar').css('margin-bottom', '20px');
            this.$naviBtnGroup = $('<div>').addClass('btn-group');
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
            // 詳細を見る
            $(document).on('mousedown', '.view-large', function () {
                self.viewDetail($(this));
            });
            // 位置を見る
            $(document).on('mousedown', '.view-position', function () {
                var marker = $(this).data('marker');
                self.viewSpotPosition(marker);
                self.selectedMarker = marker;
            });
            // 吹き出し閉じる
            $(document).on('mousedown', '.closeInfoWin', function (e) {
                var title = $(this).data('title');
                self.eachMarkers(function(marker) {
                    if (marker.title == title) {
                        self.removeInfoWindow(marker);
                        self.backMapPosition();
                    }
                });
            });
            // スライドショーの一番上に戻る
            this.$slideModal.find('.gotoTop').on('mousedown', function() {
                self.slideView(0);
                self.selectedScrollTop = 0;
            });
            // スライドショー表示へ
            this.$photoModal.find('.gotoList').on('mousedown', function() {
                self.$photoModal.modal('hide');
                self.slideView(self.selectedScrollTop);
            });
        },
        /**
         * 吹き出し表示前の位置に戻る
         * @return {Void}
         */
        backMapPosition: function () {
            if (this.isSmartPhone() && this.selectedCenter) {
                this.map.setCenter(this.selectedCenter);
            }
        },
        /**
         * コントロール設定
         * @return {Void}
         */
        setMobileControl: function() {
            var self = this;
            var $navi = $('<div>').addClass('btn-toolbar mobile-control');
            var $naviBtnGroup = $('<div>').addClass('btn-group');
            $navi.append($naviBtnGroup);
            // ズーム
            var $zoonBtn = $('<button>').addClass('btn btn-primary');
            var $zoomIcon = $('<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>').text(1);
            $zoonBtn.append($zoomIcon);
            $zoonBtn.on('mousedown', function () {
                var zoom = self.map.getZoom();
                if (Map.Config.MAX_ZOOM <= zoom) {
                    zoom = self.zoom;
                } else {
                    ++ zoom;
                }
                if (zoom == Map.Config.MAX_ZOOM) {
                    $zoomIcon.removeClass('glyphicon-zoom-in').addClass('glyphicon-zoom-out');
                } else {
                    $zoomIcon.removeClass('glyphicon-zoom-out').addClass('glyphicon-zoom-in');
                }
                self.map.setZoom(zoom);
                var text = zoom - self.zoom + 1;
                $zoomIcon.text(text);
                self.setCenterToMarker();
            });
            // 上
            var $upBtn = $('<button>').addClass('btn btn-primary');
            $upBtn.append($('<span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span>'));
            $upBtn.on('mousedown', function () {
                $centerBtn.removeClass('active');
                self.map.panBy(0, -Map.Config.MOBILE_MOVE_DISTANCE);
            });
            // 左
            var $leftBtn = $('<button>').addClass('btn btn-primary');
            $leftBtn.append($('<span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span>'));
            $leftBtn.on('mousedown', function () {
                $centerBtn.removeClass('active');
                self.map.panBy(-Map.Config.MOBILE_MOVE_DISTANCE, 0);
            });
            // 基点に戻る
            var $centerBtn = $('<button>').addClass('btn btn-primary active');
            $centerBtn.append($('<span class="fui-plus-circle" aria-hidden="true"></span>'));
            $centerBtn.on('mousedown', function () {
                $centerBtn.addClass('active');
                self.map.setCenter({lat: self.lat, lng: self.lng});
                self.selectedCenter = self.map.getCenter();
            });
            // 右
            var $rightBtn = $('<button>').addClass('btn btn-primary');
            $rightBtn.append($('<span class="glyphicon glyphicon-arrow-right" aria-hidden="true"></span>'));
            $rightBtn.on('mousedown', function () {
                $centerBtn.removeClass('active');
                self.map.panBy(Map.Config.MOBILE_MOVE_DISTANCE, 0);
            });
            // 下
            var $downBtn = $('<button>').addClass('btn btn-primary');
            $downBtn.append($('<span class="glyphicon glyphicon-arrow-down" aria-hidden="true"></span>'));
            $downBtn.on('mousedown', function () {
                $centerBtn.removeClass('active');
                self.map.panBy(0, Map.Config.MOBILE_MOVE_DISTANCE);
            });
            $naviBtnGroup.append($zoonBtn);
            $naviBtnGroup.append($upBtn);
            $naviBtnGroup.append($downBtn);
            $naviBtnGroup.append($leftBtn);
            $naviBtnGroup.append($rightBtn);
            $naviBtnGroup.append($centerBtn);
            this.map.controls[google.maps.ControlPosition.TOP_LEFT].push($navi[0]);
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
            this.data = data;
            // ボタン配置
            this.setNavigationButton();
            this.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(this.$navi[0]);
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
            // 設定ボタン
            var $settingBtn = $('<button>').addClass('btn btn-inverse').prop('title', '設定');
            $settingBtn.append($('<span class="fui-gear" aria-hidden="true"></span>'));
            $settingBtn.on('mousedown', function () {
                self.$settingModal.modal();
            });
            this.$titleBtn = $("<span>").addClass("category");
            $settingBtn.append(this.$titleBtn);
            this.$naviBtnGroup.append($settingBtn);
            // 写真一覧ボタン
            var $slideShowBtn = $('<button>').addClass('btn btn-danger').prop('title', '写真一覧');
            $slideShowBtn.append($('<span class="fui-image" aria-hidden="true"></span>'));
            $slideShowBtn.on('mousedown', function () {
                self.slideView(self.selectedScrollTop);
            });
            this.$naviBtnGroup.append($slideShowBtn);
            // Infoボタン
            var $infoBtn = $('<button>').addClass('btn btn-info').prop('title', 'Info');
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
                self.switchCategory();
            });
            // スライドショー機能設定
            this.setSlideShowModal(this.data[0].name);
            this.addToolTips();
        },
        /**
         * カテゴリ切替
         * @return {Void}
         */
        switchCategory: function () {
            var no = $('input[name="category"]:checked').val();
            this.removeAllMarker();
            this.markers = [];
            this.setMapData(this.data[no].name, this.data[no].data);
            this.$settingModal.modal('hide');
            this.selectedScrollTop = 0;
            // スライドショー機能設定
            this.setSlideShowModal(this.data[no].name);
            this.addToolTips();
        },
        /**
         * 一覧表示
         * @param {Number} scroll
         * @return {Void}
         */
        slideView: function (scroll) {
            this.$slideModal.animate({
                scrollTop: scroll
            }, "fast", "swing");
            this.$slideModal.modal();
        },
        /**
         * カテゴリ設定
         * @param {String} title
         * @return {Void}
         */
        setSlideShowModal: function (title) {
            var self = this;
            var content = this.$slideModal.find('#slideList');
            content.html('');
            this.$slideModal.find('.modal-title').text('「' + title + '」写真一覧');
            this.eachMarkers(function (marker) {
                if (!marker.photo.name) {
                    return;
                }
                var path = self.photoDir + marker.photo.name;
                
                var $titleDiv = $('<div>').text(marker.title);
                content.append($titleDiv);
                var $img = $('<img>').prop('src', path)
                    .addClass('img-responsive img-thumbnail')
                    .prop('title', marker.title);
                content.append($img);
                var $controlWrap = $('<div>').addClass('slidePhotoMenu');
                // 位置を見る
                var $viewPositionBtn = $('<button>').addClass('btn btn-success view-position').text('位置を見る').data('marker', marker);
                $controlWrap.append($viewPositionBtn);
                // 詳細
                var $largeBtn = $('<button>').addClass('btn btn-info').css('margin-left', '5px').text('詳細').data('marker', marker);
                $largeBtn.data('path', self.photoDir + marker.photo.name).data('title', marker.title).data('info', marker.info)
                $largeBtn.on('mousedown', function() {
                    self.$slideModal.modal('hide');
                    self.viewDetail($(this));
                });
                $controlWrap.append($largeBtn);

                content.append($controlWrap);
            });
        },
        /**
         * 詳細を見る
         * @param {Object} target
         * @return {Void}
         */
        viewDetail: function (target) {
            var path = target.data('path');
            var title = target.data('title');
            var info = target.data('info');
            if (path) {
                this.$photoModal.find('.modal-title').text(title);
                this.$photoModal.find('.large-photo').prop('src', path);
                this.$photoModal.find('.info').html(info);
                this.$photoModal.modal();
            }
        },
        /**
         * 位置を見る
         * @param {Object} marker
         * @return {Void}
         */
        viewSpotPosition: function (marker) {
            if (marker) {
                this.removeAllInfoWindow();
                this.bringToFront(marker);
                if (this.isSmartPhone()) {
                    this.map.setZoom(this.zoom);
                    this.map.setCenter({lat: this.lat, lng: this.lng});
                    this.popupMarker(marker, 10000, false);
                } else {
                    this.locationMarker(marker);
                }
            }
            this.selectedScrollTop = this.$slideModal.scrollTop();
            this.$slideModal.modal('hide');
        },
        /**
         * マップデータ反映
         * @param {String} category
         * @param {Array} data
         * @return {Void}
         */
        setMapData: function (category, data) {
            this.$titleBtn.text(category);
            for (var i = 0; i < data.length; i++) {
                var title = data[i]['title'];
                var lat = data[i]['lat'];
                var lng = data[i]['lng'];
                var info = data[i]['info'];
                var pin = data[i]['pin'];
                var photo = data[i]['photo'];
                var latLng = new google.maps.LatLng(lat, lng);
                var marker = this.setMarker(category, title, latLng, info, pin, photo);
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
        setMarker: function (category, title, latLng, info, pin, photo) {
            var self = this;
            // マーカー追加
            var marker = this.createMarker(this.map, category, title, latLng, info, pin, photo);
            // マウスダウン
            google.maps.event.addListener(marker, 'mousedown', function (e) {
                self.bringToFront(marker);
                self.stopAnimationMarkers();
                if (!marker.infoWindow) {
                    self.createInfoWindow(marker);
                } else {
                    self.removeInfoWindow(marker);
                }
                self.selectedMarker = marker;
                self.selectedCenter = self.map.getCenter();
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
         * 全マーカーアニメーションストップ
         * @return {Void}
         */
        stopAnimationMarkers: function () {
            this.eachMarkers(function (marker) {
                marker.setAnimation(null);
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
                self.stopAnimationMarkers();
                self.popupMarker(marker, 2000, true);
                self.removeToolTips();
                self.addToolTips();
            });
            this.map.panTo(latLng);
        },
        /**
         * 指定マーカージャンプ
         * @param {google.maps.Marker} marker
         * @param {Number} time
         * @param {Boolean} addInfoWin
         * @return void
         */
        popupMarker: function (marker, time, addInfoWin) {
            var self = this;
            marker.setAnimation(google.maps.Animation.BOUNCE);
            window.setTimeout(function () {
                marker.setAnimation(null);
                if (addInfoWin) {
                    self.createInfoWindow(marker);
                }
            }, time);
        },
        /**
         * マーカー最前面へ
         * @param {google.maps.Marker} marker
         * @return {Void}
         */
        bringToFront: function (marker) {
            var self = this;
            this.eachMarkers(function (marker, i, target) {
                // target以外を下へ
                if (marker != target) {
                    if (marker.infoWindow) {
                        marker.infoWindow.setZIndex(0);
                    }
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
            if (path) {
                content += '<div style="display: table;">';
                content += '<div style="float:left; display: table-cell; width:180px; margin:0px; padding:0px;" class="view-large" src="' + path + '" data-path="' + path + '" data-title="' + marker.title + '" data-info="' + marker.info + '">';
                content += '<a href="javascript:void(0);" >詳細を見る</a><br>';
                content += '<img src="' + path + '">';
                content += '</div>';
                content += '<div style="display:table-cell; vertical-align:middle;">';
                content += '<a style="margin-left:5px;" href="javascript:void(0);" class="closeInfoWin btn btn-default btn-sm" data-title="' + marker.title + '">閉じる</a>';
                content += '</div>';
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
                self.backMapPosition();
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
         * スマホ判定
         * @return {Boolean}
         */
        isSmartPhone: function () {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf('iPhone') != -1 ||
                userAgent.indexOf('iPod') != -1 || 
                (userAgent.indexOf('Android') != -1 && userAgent.indexOf('Mobile') != -1)) {
                return true;
            }
            return false;
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