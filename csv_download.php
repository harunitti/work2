<?php

class CSV
{    
    public function __construct()
    {
    }

    /**
     * CSVダウンロード
     * @param array $list
     * @param array $header
     * @param string $filename
     */
    public function download($list, $header, $filename)
    {
        if (count($header) > 0) {
            array_unshift($list, $header);
        }
        $stream = fopen('php://temp', 'r+b');
        foreach ($list as $row) {
            fputcsv($stream, $row);
        }
        rewind($stream);
        $csv = str_replace(PHP_EOL, "\r\n", stream_get_contents($stream));
        $csv = mb_convert_encoding($csv, 'SJIS-win', 'UTF-8');
        header('Content-Type: text/csv');
        header("Content-Disposition: attachment; filename=$filename");
        echo $csv;
    }
}
if (is_array($_POST["data"])) {
    $list = [];
    foreach ($_POST["data"] as $data) {
        $list[] = explode(",", $data);
    }
    $csv = new CSV;
    $filename = date('Ymd_His')."_kojo_map.csv";
    $csv->download($list, [], $filename);
}