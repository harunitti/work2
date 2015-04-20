# 高岡古城公園マップ作成ツール

高岡古城公園マップ作成ツールはGoogleMapApiv3を利用した地図を作るためのツールです。

地点情報の作成・編集・確認を行い最終的にCSVデータを作成することが目的です。

![Screencast](https://github.com/niiyz/kojo_map_tool/blob/master/screencast1.gif)

# CSV仕様

 ```csv
  タイトル,緯度,経度,説明,アイコン画像ファイル名,写真ファイル名
 ```

 サンプル
 
 ```csv 
  ペンギン,36.74919215362724,137.0208728313446,ペンギンがいます。<br>10匹くらいいます。,pengin_icon.png,pengin1.jpg
  フラミンゴ,36.74919215362724,137.0208728313446,フラミンゴがいます。<br>20匹くらいいます。,flamingo_icon.svg,flamingo1.png
 ```

#URL
  高岡古城公園マップ作成ツール
　http://kojo.niiyz.com/

#設定ファイル
  古城公園以外で使用する場合は、js/tool_config.jsのConfig.LAT, Config.LNGを変更してマップの初期位置を変えてください。

#操作

## 1. 新規マーカー追加
 地図上でダブルクリックした位置にマーカーを作成します。

## 2. マーカー位置変更
 マーカーをドラッグ&ドロップしてください。

## 3. マーカー編集・削除
 対象のマーカーを長押しするとモダールウインドウが表示されます。
 
 編集は各フォームを編集後に更新ボタンで確定します。
 
 削除する場合は削除ボタンを押してください。
 
 変更しないときはキャンセルボタン押して地図に戻ってください。

### マーカー情報フォーム内容

| 項目    　　| 意味  |
| :------ |:---------------|
| タイトル      | ・マウスオーバーで表示されます。 <br>・情報ウインドウ(吹き出し)のタイトルとして使用します。|
| 緯度 | ・地点の緯度です。        |
| 経度 | ・地点の経度です。        |
| 説明 | ・情報ウインドウ(吹き出し)に表示する説明です。<br> ・HTMLが使用できます。  <br>・&lt;br&gt;で改行してください。  |
| アイコン画像ファイル名 |  ・マーカーのアイコン画像です。<br> ・指定しない場合はGoogleMap標準のものになります。 <br>・png、svgを指定してください。<br>  ※アイコン画像、写真に関してはFTPでアップロードしてもらう予定です。        |
| 写真ファイル名　       | ・情報ウインドウ(吹き出し)に表示する画像です。<br>・画像は内部でimgタグに横幅180pxを指定しますので予めリサイズ(500px * 500px 以下くらい)してください。<br>・jpeg、pngを指定してください。<br>    ※アイコン画像、写真に関してはFTPでアップロードしてもらう予定です。      |

　
## 4. 情報ウインドウ表示・非表示
 「情報ウインドウ表示」ボタン を押すと現在あるマーカー全ての情報ウインドウを表示します。
 
 再度押すと全て消します。
 
 各情報ウインドウの×で個別に消せます。

## 5. 地図情報CSV出力
  地図に更新があった場合に自動でCSVテキストエリア更新します。


## 6. 地図情報CSV復元
  CSVテキストエリアにCSVを貼り付けて「復元」ボタンを押すと地図を復元します。
  
  前回のCSVを保存しておいてコピーして再開できます。

## 7. 地図情報CSVダウンロード(PCのみ)
　6のCSVテキストエリアにあるものをファイルとしてダウンロードします。


## 8. 現在地表示(スマホのみ)
　現在地を青いアイコンで表示します。

「現在地に打つ」ボタンを押すと現在地にマーカーを打ちます。
　


マーカーはPCと同じでタッチすると編集モダールが表示されて情報を編集できます。


![Screencast](https://github.com/niiyz/kojo_map_tool/blob/master/screencast2.gif)

# マップ本体 準備1 CSV設置

マップ作成ツールでCSVファイルを作成したらcsvディレクトリを作成して配下に設置します。

~~~
% mkdir csv
~~~

CSVを設置する。

~~~
% ls csv
shizen_kojyo_map.csv    rekishi_kojyo_map.csv
~~~

# マップ本体 準備2 make_map_data.php編集

make_map_data.phpはカテゴリ毎CSVを結合して１つのjsonファイルを作成します。
make_map_data.phpの下部でカテゴリ名と対応するCSVを記述してください。

~~~
$data = new MakeMapData;
$data->addCategory("歴史", "rekishi_kojyo_map.csv");
$data->addCategory("自然", "shizen_kojyo_map.csv");
$data->make();
~~~

# マップ本体 準備3 make_map_data.php実行

make_map_data.phpを実行すると同階層にmap_data.jsonが作成されます。

~~~
% php make_map_data.php
% ls
map_data.json
~~~


# マップ本体 準備4 マップデータ配置

map_data.jsonをpublic/data/map_data.jsonとして設置します。

~~~
% mkdir public/data
% mv map_data.json public/data/map_data.json 
~~~

# マップ本体 準備5 初期位置(緯度経度)設定

js/map_config.jsで初期位置(緯度経度)の設定をしてください。

~~~
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
~~~

# マップ本体　表示

js/map.js内からdata/map_data.jsonを読み込んでマップを表示します。

map.html
~~~
<script type="text/javascript" src="js/map_config.js" charset="UTF-8"></script>
<script type="text/javascript" src="js/map.js" charset="UTF-8"></script>
<script>
window.onload = function () {
    var app = new Map.App();
    app.initialize();
};
</script>
~~~
