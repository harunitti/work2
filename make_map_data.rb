require 'csv'
require 'json'
require 'cgi'
require 'image_size'
require 'yaml'

class MakeMapData

  def initialize
    @mapData = []
    @config = YAML.load_file("config.yml")
    @fileData = @config['category']
    p @fileData
  end

  def make
    @fileData.each do |category|
      data = []
      path = @config['csv'] + category['csv']
      CSV.foreach(path) do |row|
        if row.size != 6 then
          next
        end
        line = {}
        line['title']  = self.escape(row[0])
        line['lat']    = self.escape(row[1])
        line['lng']    = self.escape(row[2])
        line['info']   = self.escape(row[3], true)
        pin = self.escape(row[4])
        line['pin']    = {'name': pin, 'size': self.getImageSize(@config['image']['icon'], pin)}
        photo = self.escape(row[5])
        line['photo']  = {'name': photo, 'size': self.getImageSize(@config['image']['photo'], photo)}
        data.push(line)
      end
      @mapData.push({'name': category['name'], 'data': data})
    end
    File.open(@config['save']['json'], 'w').write(JSON.generate(@mapData))
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
data.make()
