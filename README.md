# 高岡古城公園マップ作成ツール

高岡古城公園マップ作成ツールはGoogleMapAPIv3を利用した地図を作るためのツールです。

![Screencast](https://github.com/niiyz/kojo_map_tool/blob/master/screencast1.gif)

## 特徴

- マップ作成ツール(tool.html)で地点情報の作成・編集・確認をしてCSVデータを作成します。
- 地点情報にはテキスト、写真、アイコンを紐付けます。
- CSV1つで1カテゴリとなります
- 集めたCSVデータを1ファイルのjsonにします。
- マップ画面(index.html)でjsonを読み込んでオリジナルのGoogleマップを表示します。
- モバイル端末でアクセスした場合に現在地を表示します。

# Deploy on Heroku

[![Heroku Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/niiyz/KojoMapTool)


# ローカルでサクッと試す(MacOSX)

```
$ git clone https://github.com/niiyz/KojoMapTool.git kojo
$ cd kojo
$ npm install
$ sudo gem install foreman
$ foreman start
// ブラウザでhttp://localhost:5000/ でマップ表示
// ブラウザでhttp://localhost:5000/tool.html でマップ作成(管理画面)表示
```

# 1. マップ作成ツール画面

## 1-1 設定ファイル編集(tool_config.js)

tool_config.jsを編集して緯度、経度、初期ズームを変更します。

src/js/tool/tool_config.js
```
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
        /**
         * ズーム
         * @type {Number}
         */ 
        ZOOM: 17,
```

環境によっては画像パスも変更してください。

jsを編集したらgulpコマンドを叩いて結合圧縮したJSファイルを出力します。

```
$ gulp
```

## 1-2 画像を設置する。

public/images/photoにアイコン用画像、public/images/photoに地点の写真(吹き出しに表示)を設置してください。

画像を設置するとマップ作成ツールのマーカー編集で選択できるようになります。

## 1-3. マップ作成ツール操作

- 新規マーカー追加(地図上でダブルクリックした位置にマーカーを作成します。)
- マーカー位置変更(マーカーをドラッグ&ドロップしてください。)
- マーカー編集・削除(対象のマーカーを長押しするとモダールウインドウが表示されます。)
- 情報ウインドウ表示・非表示(「情報ウインドウ表示」ボタン を押すと現在あるマーカー全ての情報ウインドウを表示します。)

### マーカー編集フォーム内容

| 項目    　　| 意味  |
| :------ |:---------------|
| タイトル      | ・マウスオーバーで表示されます。 <br>・情報ウインドウ(吹き出し)のタイトルとして使用します。|
| 緯度 | ・地点の緯度です。        |
| 経度 | ・地点の経度です。        |
| 説明 | ・情報ウインドウ(吹き出し)に表示する説明です。<br> ・HTMLが使用できます。  <br>・&lt;br&gt;で改行してください。  |
| アイコン画像ファイル名 |  ・マーカーのアイコン画像です。<br> ・指定しない場合はGoogleMap標準のものになります。 <br>・pngを指定してください。   |
| 写真ファイル名　       | ・情報ウインドウ(吹き出し)に表示する画像です。<br>・画像は内部でimgタグに横幅180pxを指定しますので予めリサイズ(500px * 500px 以下くらい)してください。<br>・jpeg、pngを指定してください。<br>    |


## 1-4. CSVについて
- 地図情報CSV出力( 地図に更新があった場合に自動でCSVテキストエリア更新します。)
- 地図情報CSV復元( CSVテキストエリアにCSVを貼り付けて「復元」ボタンを押すと地図を復元します。)
- 地図情報CSVダウンロード(CSVテキストエリアにあるものをファイルとしてダウンロードします。※PCのみ）

### CSV仕様

 ```csv
  タイトル,緯度,経度,説明,アイコン画像ファイル名,写真ファイル名
 ```

 サンプル
 
 ```csv 
  ペンギン,36.74919215362724,137.0208728313446,ペンギンがいます。<br>10匹くらいいます。,pengin_icon.png,pengin1.jpg
  フラミンゴ,36.74919215362724,137.0208728313446,フラミンゴがいます。<br>20匹くらいいます。,flamingo_icon.svg,flamingo1.png
 ```

## 1.5 現在地表示(スマホのみ)

- 現在地を青いアイコンで表示します。
- 「現在地に打つ」ボタンを押すと現在地にマーカーを打ちます。
- マーカーはPCと同じでタッチすると編集モダールが表示されて情報を編集できます。


![Screencast](https://github.com/niiyz/kojo_map_tool/blob/master/screencast2.gif)

# 2. マップデータ作成

カテゴリ毎に作成したCSVデータを1つのJsonデータにまとめます。

## 2-1. CSV設置

マップ作成ツールで作成したCSVファイルを全部csvディレクトリに設置します。

~~~
% mkdir csv
~~~

CSVを設置する。

~~~
% ls csv
shizen_kojyo_map.csv    rekishi_kojyo_map.csv
~~~

## 2-2. 設定ファイル編集(config.yml)

make_map_data.rbはカテゴリ毎CSVを結合して１つのjsonファイルを作成します。

設定ファイルのcategoryにカテゴリ名と対応するCSVを記述してください。

config.yml
~~~
category:
  - name: '歴史'
    csv: 'rekishi_kojyo_map.csv'
  - name: '自然'
    csv: 'shizen_kojyo_map.csv'
  - name: '銅像'
    csv: 'bronze_kojyo_map.csv'
~~~

## 2-3. make_map_data.rb実行

画像のサイズを取得しているのでimagesに画像が必要です。

make_map_data.rbを実行すると同階層にmap_data.jsonが作成されます。

~~~
% ruby make_map_data.rb
% ls
map_data.json
~~~

# 3. マップ本体

## 3-1. Jsonデータ配置

map_data.jsonをpublic/data/map_data.jsonとして設置します。

~~~
% mkdir public/data
% mv map_data.json public/data/map_data.json 
~~~

## 3-2. 設定ファイル編集(map_config.js)

設定ファイルを編集して緯度、経度、初期ズームの設定をしてください。

src/js/map/map_config.js
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

jsを編集したらgulpコマンドを叩いて結合圧縮したJSファイルを出力します。

```
$ gulp 
```

