<?php

class CSV
{    
    
    protected $csv = '';
    protected $filename = '';
    
    /**
     * CSV
     * @param array $list
     * @param array $header
     */    
    public function __construct($list, $header=[])
    {
        if (count($header) > 0) {
            array_unshift($list, $header);
        }
        $stream = fopen('php://temp', 'r+b');
        foreach ($list as $row) {
            fputcsv($stream, $row);
        }
        rewind($stream);
        $this->csv = str_replace(PHP_EOL, "\r\n", stream_get_contents($stream));
        $this->csv = mb_convert_encoding($this->csv, 'SJIS-win', 'UTF-8');
        $this->filename = date('Ymd_His') . "_kojo_map.csv";
    }

    /**
     * ダウンロード
     */
    public function download()
    {
        header('Content-Type: text/csv');
        header("Content-Disposition: attachment; filename={$this->filename}");
        echo $this->csv;
    }
}
if (is_array($_POST["data"])) {
    $list = [];
    foreach ($_POST["data"] as $data) {
        $list[] = explode(",", $data);
    }
    $csv = new CSV($list);
    $csv->download();
}