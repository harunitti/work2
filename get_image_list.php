<?php

class GetImageList
{    
    public function __construct()
    {
    }
    
    public function load()
    {
        $photoList = $this->getPathList("./images/photo");
        $iconList = $this->getPathList("./images/icon");
        sort($photoList);
        sort($iconList);
        $result = ["photo" => $photoList, "pin" => $iconList];
        echo json_encode($result);
    }
    
    /**
     * getPathList
     * @param string $dir
     * @return array $list
     */
    protected function getPathList($dir)
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
                $list[] = $info->getFilename();
            }
        }
        return $list;
    }
}

$img = new GetImageList;
$img->load();
