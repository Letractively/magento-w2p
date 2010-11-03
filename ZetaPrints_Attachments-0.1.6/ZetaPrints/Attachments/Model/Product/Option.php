<?php

class ZetaPrints_Attachments_Model_Product_Option extends Mage_Catalog_Model_Product_Option
{
  const OPTION_TYPE_ATTACHMENT = 'file';
  const OPTION_GROUP_ATTACHMENT   = 'attachments';

  /**
   * (non-PHPdoc)
   * @see Mage_Catalog_Model_Product_Option::getGroupByType()
   */
  public function getGroupByType($type = null)
  {
    if ($type == self::OPTION_TYPE_ATTACHMENT) {
      $product_id = $this; // this is debug help only

      // currently we haven't applied our custom option type
      // so we try to get what should we use from product
      // if no product can be found we continue with
      // ajax attachments, if product is found and has
      //  use_ajax_upload set to anything but 'Yes'
      // we load standard file upload

      $product = null;
      if($this->getProduct()){
        $product = $this->getProduct();
      }elseif (Mage::registry('product')) {
        $product = Mage::registry('product');
      }elseif ($this->hasData('product_id')) {
        $product = Mage::getModel('catalog/product')->load($this->getData('product_id'));
      }
      if ($product instanceof Mage_Catalog_Model_Product ){
        if($product->getAttributeText('use_ajax_upload') != 'Yes') {
          return parent::getGroupByType($type);
        }
      }
    return self::OPTION_GROUP_ATTACHMENT;
    }
    return parent::getGroupByType($type);
  }
}

