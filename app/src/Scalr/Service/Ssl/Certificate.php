<?php
class Scalr_Service_Ssl_Certificate extends Scalr_Model
{
    protected $dbTableName = 'services_ssl_certs';
    protected $dbPrimaryKey = "id";
    protected $dbMessageKeyNotFound = "Ssl certificate #%s not found in database";

    protected $dbPropertyMap = array(
        'id'			=> 'id',
        'env_id'		=> array('property' => 'envId', 'is_filter' => false),
        'name'          => 'name',
        'ssl_pkey'      => array('property' => 'privateKey', 'type' => 'encrypted', 'is_filter' => false),
        'ssl_pkey_password'  => array('property' => 'privateKeyPassword', 'type' => 'encrypted', 'is_filter' => false),
        'ssl_cert'      => array('property' => 'certificate', 'is_filter' => false),
        'ssl_cabundle'  => array('property' => 'caBundle', 'is_filter' => false)
    );

    public $id,
        $envId,
        $name,
        $privateKey,
        $privateKeyPassword,
        $certificate,
        $caBundle;

    public function getCertificateName()
    {
        $info = openssl_x509_parse($this->certificate, false);
        return $info['name'] ? $info['name'] : 'uploaded';
    }

    public function getCaBundleName()
    {
        $info = openssl_x509_parse($this->caBundle, false);
        return $info['name'] ? $info['name'] : 'uploaded';
    }

    /**
     * {@inheritdoc}
     * @see Scalr_Model::delete()
     */
    public function delete($id = null)
    {
        if ($this->db->GetOne('SELECT COUNT(*) FROM apache_vhosts WHERE ssl_cert_id = ?', array($this->id)) > 0)
            throw new Scalr_Exception_Core(sprintf('Certificate "%s" is used by apache virtual host(s)', $this->name));

        parent::delete();
    }
}
