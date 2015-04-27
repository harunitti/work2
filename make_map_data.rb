require 'csv'
require 'json'
require 'cgi'
require 'image_size'

class MakeMapData
  CSV_DIR   = 'csv/'
  ICON_DIR  = 'public/images/icon/'
  PHOTO_DIR = 'public/images/photo/'

  SAVE_DATA_PATH = 'map_data.json'

  def initialize
    @mapData = []
    @fileData = []
  end

  def add(name, file)
    if File.exist?(CSV_DIR + file) then
      @fileData.push({name: name, path: CSV_DIR + file})
    else
      p '存在しないファイル:' + CSV_DIR + file
    end
  end

  def make
    @fileData.each do |category|
      p category[:name] + ' ' + category[:path]
      data = []
      CSV.foreach(category[:path]) do |row|
        if row.size != 6 then
          next
        end
        line = {}
        line['title']  = self.escape(row[0])
        line['lat']    = self.escape(row[1])
        line['lng']    = self.escape(row[2])
        line['info']   = self.escape(row[3], true)
        pin = self.escape(row[4])
        line['pin']    = {'name': pin, 'size': self.getImageSize(ICON_DIR, pin)}
        photo = self.escape(row[5])
        line['photo']  = {'name': photo, 'size': self.getImageSize(PHOTO_DIR, photo)}
        data.push(line)
      end
      @mapData.push({'name': category[:name], 'data': data})
    end
    File.open(SAVE_DATA_PATH, 'w').write(JSON.generate(@mapData))
  end

  def getImageSize(dir, file)
    if !Dir.exist?(dir) || file.nil?
      return {'width': 0, 'height': 0}
    end
    path = dir + file
    if !File.exist?(path) then
      width  = 0
      height = 0
    else
      size = ImageSize.path(path).size
      width  = size[0]
      height = size[1]
    end
    return {'width': width, 'height': height}
  end

  def escape(str, isAllowBR=false)
    if !str.nil?
      if isAllowBR then
        str = str.gsub(/<br>/, 'z::::::z')
        str = CGI.escapeHTML(str)
        str = str.gsub(/z::::::z/, '<br>')
      else
        str = CGI.escapeHTML(str)
      end
    end
    return str
  end
end

data = MakeMapData.new
data.add('歴史', 'rekishi_kojyo_map.csv')
data.add('自然', 'shizen_kojyo_map.csv')
data.add('銅像', 'bronze_kojyo_map.csv')
data.make()
