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
        div.className = 'ttip';
        div.title = this.marker.title;
        this.div = div;

        var panes = this.getPanes();
        panes.floatPane.appendChild(div);
    };
    /**
     * 描画
     * @return {Void}
     */
    Map.Tooltip.prototype.draw = function () {
        var latLng = this.marker.getPosition();
        var overlayProjection = this.getProjection();
        var point = overlayProjection.fromLatLngToDivPixel(latLng);
        this.div.style.left = point.x + 'px';
        var y = point.y + this.marker.iconOffsetHeight;
        this.div.style.top = y + 'px';
        $(this.div).tooltip('show');
    };
    /**
     * 非表示
     * @return {Void}
     */
    Map.Tooltip.prototype.hide = function () {
        if (this.div) {
            this.div.style.visibility = "hidden";
            $(this.div).tooltip('hide');
        }
    };
    /**
     * 表示
     * @return {Void}
     */
    Map.Tooltip.prototype.show = function () {
        if (this.div) {
            this.div.style.visibility = "visible";
            $(this.div).tooltip('show');
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
      $(this.div).tooltip('destroy');
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }

})(this);

