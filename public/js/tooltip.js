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
     * 追加
     * @return {Void}
     */
    Map.Tooltip.prototype.onAdd = function () {
        var div = document.createElement('div');
        div.style.position = "absolute";
        div.style.fontWeight = "bold";
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
        var latLng = this.marker.getPosition();
        var map = this.getMap();
        var bounds = map.getBounds();
        if (!bounds.contains(latLng)) {
            this.hide();
            return;
        }
        this.show();
        var overlayProjection = this.getProjection();
        var point = overlayProjection.fromLatLngToDivPixel(latLng);
        var x = point.x;
        var y = point.y + this.marker.iconOffsetHeight - 15;
        if (!this.marker.pin) {
            x += 15;
        }
        this.div.style.left = x + 'px';
        this.div.style.top = y + 'px';
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

