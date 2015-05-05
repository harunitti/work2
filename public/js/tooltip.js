/**
 * ツールチップオーバーレイ
 *
 * @author yoshida@niiyz.com (Tetsuya Yoshida)
 */
(function (global) {

    'use strict';

    var Map = global.Map || (global.Map = {});
    
    /**
     * ツールチップオーバーレイ
     */
    Map.Tooltip = function (map, marker) {
        this.marker = marker;
        this.setMap(map);
    };
    /**
     * オーバーレイビュー継承
     */
    Map.Tooltip.prototype = new google.maps.OverlayView();
    /**
     * 最小表示ズーム
     */
    Map.Tooltip.prototype.SHOW_MIN_ZOOM = 17;
    /**
     * オフセット
     */
    Map.Tooltip.prototype.OFFSET_X = 15;
    Map.Tooltip.prototype.OFFSET_Y = -15;
    /**
     * 追加
     * @return {Void}
     */
    Map.Tooltip.prototype.onAdd = function () {
        var div = document.createElement('div');
        div.style.position = "absolute";
        div.style.fontWeight = "bold";
        div.style.minWidth = '120px';
        div.innerHTML = this.marker.title;
        this.div = div;
        var panes = this.getPanes();
        panes.markerLayer.appendChild(div);
    };
    /**
     * 描画
     * @return {Void}
     */
    Map.Tooltip.prototype.draw = function () {
        var map = this.getMap();
        var zoom = map.getZoom();
        if (zoom < this.SHOW_MIN_ZOOM) {
            this.hide();
            return;
        }
        var latLng = this.marker.getPosition();
        var bounds = map.getBounds();
        if (!bounds.contains(latLng)) {
            this.hide();
            return;
        }
        this.show();
        var overlayProjection = this.getProjection();
        var point = overlayProjection.fromLatLngToDivPixel(latLng);
        var x = point.x;
        var y = point.y + this.marker.iconOffsetHeight + this.OFFSET_Y;
        if (!this.marker.pin) {
            x += this.OFFSET_X;
        }
        this.div.style.left = x + 'px';
        this.div.style.top = y + 'px';
        if (zoom ==  this.SHOW_MIN_ZOOM) {
            this.div.style.fontSize = "0.6em";
        } else {
            this.div.style.fontSize = "1em";
        }
    };
    /**
     * 非表示
     * @return {Void}
     */
    Map.Tooltip.prototype.hide = function () {
        if (this.div) {
            this.div.style.visibility = "hidden";
        }
    };
    /**
     * 表示
     * @return {Void}
     */
    Map.Tooltip.prototype.show = function () {
        if (this.div) {
            this.div.style.visibility = "visible";
        }
    };
    /**
     * トグル
     * @return {Void}
     */
    Map.Tooltip.prototype.toggle = function () {
        if (this.div) {
            if (this.div.style.visibility == "hidden") {
                this.show();
            } else {
                this.hide();
            }
        }
    };
    /**
     * 削除
     * @return {Void}
     */
    Map.Tooltip.prototype.onRemove = function() {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }

})(this);

