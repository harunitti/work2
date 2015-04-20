<?php

class GetMapData
{
    protected $data = [];
    
    const CSV_DATA_DIR = 'csv/';
    
    const SAVE_DATA_PATH = 'map_data.json';
    
    public function __construct()
    {
    }

    public function addCategory($name, $filename)
    {
        $file = new SplFileObject(self::CSV_DATA_DIR.$filename);
        if ($file == false) {
            return;
        }
        $file->setFlags(SplFileObject::READ_CSV);
        $category = [];
        foreach ($file as $row) {
            if (!isset($row[0])) {
                continue;
            }
            $d = [];
            $d["title"] = $this->h($row[0], false);
            $d["lat"]   = $this->h($row[1], false);
            $d["lng"]   = $this->h($row[2], false);
            $d["info"]  = $this->h($row[3], true);
            $pin = $this->h($row[4], false);
            $d["pin"]   = ["name" => $pin, "size" => $this->getImageSize($pin)];
            $photo = $this->h($row[5], false);
            $d["photo"] = ["name" => $photo, "size" => $this->getImageSize($photo)];
            $category[] = $d;
        }
        $this->data[] = ["name"=>$name, "data"=>$category];
    }

    protected function getImageSize($filename) {
        if (!file_exists($filename)) {
            return ["width"=> 0, "height"=> 0];
        }
        if (pathinfo($filename, PATHINFO_EXTENSION) == "svg") {
            $xml = simplexml_load_file($filename);
            $width = (string)$xml->attributes()->width;
            $height = (string)$xml->attributes()->height;
            $width = substr($width, 0, -2);
            $height = substr($height, 0, -2);
        } else {
            list($width, $height) = getimagesize($filename);
        }
        return ["width"=> $width, "height"=> $height];
    }
    
    protected function h($str, $allowBR=false) {
        if ($allowBR) {
            $str = str_replace("<br>", "+*+br+*+", $str);
        }
        if (strlen($str)) {
            $str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
        }
        if ($allowBR) {
            $str = str_replace("+*+br+*+", "<br>", $str);
        }
        return $str;
    }

    public function make()
    {
        $fp = fopen(self::SAVE_DATA_PATH, "w");
        fwrite($fp, json_encode($this->data));
        fclose($fp);
    }
}

$data = new GetMapData;
$data->addCategory("歴史", "rekishi_kojyo_map.csv");
$data->addCategory("自然", "shizen_kojyo_map.csv");
$data->make();
