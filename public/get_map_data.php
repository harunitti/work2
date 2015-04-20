<?php

class GetMapData
{
    protected $data = [];
    
    const DATA_DIR = '../data/';
    
    public function __construct()
    {
    }

    public function addCategory($name, $filename)
    {
        $file = new SplFileObject(self::DATA_DIR.$filename);
        if ($file == false) {
            return;
        }
        $file->setFlags(SplFileObject::READ_CSV);
        $csv = [];
        foreach ($file as $row) {
            $this->h($row[0]);
            $this->h($row[1]);
            $this->h($row[2]);
            $this->h($row[3], true);
            $this->h($row[4]);
            $csv[] = $row;
        }
        $this->data[] = ["name"=>$name, "data"=>$csv];
    }
    
    protected function h(&$str, $allowBR=false) {
        if ($allowBR) {
            $str = str_replace("<br>", "+*+br+*+", $str);
        }
        if (strlen($str)) {
            $str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
        }
        if ($allowBR) {
            $str = str_replace("+*+br+*+", "<br>", $str);
        }
    }

    public function load()
    {
        echo json_encode($this->data);
    }
}

$data = new GetMapData;
$data->addCategory("歴史", "rekishi_kojyo_map.csv");
$data->addCategory("自然", "shizen_kojyo_map.csv");
$data->load();
