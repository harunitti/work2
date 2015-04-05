# 高岡古城公園マップ作成ツール

#URL
  http://kojo.niiyz.com/

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
#### タイトル
  マウスオーバーで表示されます。
  
  情報ウインドウ(吹き出し)のタイトルとして使用します。
  
#### 緯度
  マーカーの位置です。

#### 経度
  マーカーの位置です。

#### 説明
  情報ウインドウの説明です。
  
  HTMLが使用できます。
  
  改行はタグ(&lt;br&gt;)を使ってください。
  
#### アイコン画像ファイル名
  マーカーのアイコン画像です。
  
  指定しない場合はGoogleMap標準のものになります。

#### 写真ファイル名
  情報ウインドウで表示する画像です。
  
  画像は内部でimageタグに横幅180pxを指定します。


## 4. 情報ウインドウ表示・非表示
 「情報ウインドウ表示」ボタン を押すと現在あるマーカー全ての情報ウインドウを表示します。
 
 再度押すと全て消します。
 
 各情報ウインドウの×で個別に消せます。

## 5. 地図情報CSV出力
  地図に更新があった場合に自動でCSVテキストエリア更新します。
  
  CSV仕様
 
 ```csv
  タイトル,緯度,経度,説明,アイコン画像ファイル名,写真ファイル名
 ```
 
 ```csv 
  ペンギン,36.74919215362724,137.0208728313446,ペンギンがいます。<br>10匹くらいいます。,pengin_icon.png,pengin1.jpg
 ```

## 6. 地図情報CSV復元
  CSVテキストエリアにCSVを貼り付けて「復元」ボタンを押すと地図を復元します。前回のCSVを保存しておいてコピーして再開できます。

## 7. 地図情報CSVダウンロード
　6のCSVテキストエリアにあるものをファイルとしてダウンロードします。
  
  ※「CSVダウンロード」ボタンはPCのみ表示しています。


