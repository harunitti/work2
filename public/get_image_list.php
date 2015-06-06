<?php

class GetImageList
{    
    public function __construct()
    {
    }
    
    public function load()
    {
        $photoList = $this->getPathList("./images/photo");
        $iconList = $this->getPathList("./images/icon", true);
        sort($photoList);
        sort($iconList);
        $result = ["photo" => $photoList, "pin" => $iconList];
        echo json_encode($result);
    }
    
    /**
     * getPathList
     * @param string $dir
     * @param bool $getSize
     * @return array $list
     */
    protected function getPathList($dir, $getSize=false)
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $dir,
                \FilesystemIterator::SKIP_DOTS
                | \FilesystemIterator::KEY_AS_PATHNAME
                | \FilesystemIterator::CURRENT_AS_FILEINFO
            ), \RecursiveIteratorIterator::SELF_FIRST
        );
        $list = [];
        foreach ($iterator as $pathName => $info) {
            if ($info->isFile()) {
                $file = [];
                $file['name'] = $info->getFilename();
                if ($getSize) {
                    #if (pathinfo($file['name'], PATHINFO_EXTENSION) == "svg") {
                    #    $xml = simplexml_load_file($pathName);
                    #    $width = (string) $xml->attributes()->width;
                    #    $height = (string) $xml->attributes()->height;
                    #    $file['width'] = substr($width, 0, -2);
                    #    $file['height'] = substr($height ,0, -2);
                    #} else {
                        list($width, $height) = getimagesize($pathName);
                        $file['width'] = $width;
                        $file['height'] = $height;
                    #}
                }
                $list[] = $file;
            }
        }
        return $list;
    }
}

$img = new GetImageList;
$img->load();
