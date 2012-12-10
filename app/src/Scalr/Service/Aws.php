<?php
namespace Scalr\Service;

use Scalr\Service\Aws\CloudWatch;
use Scalr\Service\Aws\Sqs;
use Scalr\Service\Aws\S3;
use Scalr\Service\Aws\Iam;
use Scalr\DependencyInjection\Container;
use Scalr\Service\Aws\Elb;
use Scalr\Service\Aws\ServiceInterface;
use Scalr\Service\Aws\Client\QueryClient;
use Scalr\Service\Aws\Client\ClientInterface;

/**
 * Amazon Web Services software development kit
 *
 * @author   Vitaliy Demidov  <zend@i.ua>
 * @since    18.09.2012
 *
 * @property-read  \Scalr\Service\Aws\Elb        $elb        Amazon Elastic Load Balancer (ELB) service interface instance
 * @property-read  \Scalr\Service\Aws\CloudWatch $cloudWatch Amazon CloudWatch service interface instance
 * @property-read  \Scalr\Service\Aws\Sqs        $sqs        Amazon Simple Queue Service (SQS) interface instance
 * @property-read  \Scalr\Service\Aws\S3         $s3         Amazon Simple Storage Service (S3) interface instance
 * @property-read  \Scalr\Service\Aws\Iam        $iam        Amazon Identity and Access Management Service (IAM) interface instance
 */
class Aws
{

	/**
	 * Access Key Id
	 * @var string
	 */
	private $accessKeyId;

	/**
	 * Secret Access Key
	 * @var string
	 */
	private $secretAccessKey;

	/**
	 * United States East (Northern Virginia) Region.
	 */
	const REGION_US_EAST_1 = 'us-east-1';

	/**
	 * United States West (Northern California) Region.
	 */
	const REGION_US_WEST_1 = 'us-west-1';

	/**
	 * United States West (Oregon) Region.
	 */
	const REGION_US_WEST_2 = 'us-west-2';

	/**
	 * Europe West (Ireland) Region.
	 */
	const REGION_EU_WEST_1 = 'eu-west-1';

	/**
	 * Asia Pacific Southeast (Singapore) Region.
	 */
	const REGION_AP_SOUTHEAST_1 = 'ap-southeast-1';

	/**
	 * Sydney
	 */
	const REGION_AP_SOUTHEAST_2 = 'ap-southeast-2';

	/**
	 * Asia Pacific Northeast (Tokyo) Region.
	 */
	const REGION_AP_NORTHEAST_1 = 'ap-northeast-1';

	/**
	 * South America (Sao Paulo) Region.
	 */
	const REGION_SA_EAST_1 = 'sa-east-1';

	/**
	 * Elastic Load Balancer Web service interface
	 */
	const SERVICE_INTERFACE_ELB = 'elb';

	/**
	 * Amazon CloudWatch Web service interface
	 */
	const SERVICE_INTERFACE_CLOUD_WATCH = 'cloudWatch';

	/**
	 * Amazon Simple Queue Service interface
	 */
	const SERVICE_INTERFACE_SQS = 'sqs';

	/**
	 * Amazon Simple Storage Service interface
	 */
	const SERVICE_INTERFACE_S3 = 's3';

	/**
	 * Amazon Identity and Access Management Service interface
	 */
	const SERVICE_INTERFACE_IAM = 'iam';

	/**
	 * Region for AWS
	 *
	 * @var string
	 */
	private $region;

	/**
	 * @var Container
	 */
	protected $container;

	/**
	 * Reflection class of Aws
	 *
	 * @var \ReflectionClass
	 */
	private static $reflection;

	/**
	 * Array of the instances of the service interfaces
	 *
	 * @var array
	 */
	private $serviceInterfaces = array();

	/**
	 * Constructor
	 *
	 * @param   string     $accessKeyId      AWS access key id
	 * @param   string     $secretAccessKey  AWS secret access key
	 * @param   string     $region           optional An AWS region. (Aws::REGION_US_EAST_1)
	 */
	public function __construct($accessKeyId, $secretAccessKey, $region = null)
	{
		$this->container = Container::getInstance();
		$this->region = $region;
		$this->accessKeyId = $accessKeyId;
		$this->secretAccessKey = $secretAccessKey;
	}

	/**
	 * Gets container
	 *
	 * @return Container
	 */
	public function getContainer()
	{
		return $this->container;
	}

	/**
	 * Gets region
	 *
	 * @return    string   Returns region that has been provided for instance
	 */
	public function getRegion()
	{
		return $this->region;
	}

	/**
	 * Gets implemented web service interfaces
	 *
	 * @return     array Returns Returns the list of available (implemented) web service interfaces
	 */
	static public function getAvailableServiceInterfaces()
	{
		return array(
			self::SERVICE_INTERFACE_ELB,
			self::SERVICE_INTERFACE_CLOUD_WATCH,
			self::SERVICE_INTERFACE_SQS,
			self::SERVICE_INTERFACE_S3,
			self::SERVICE_INTERFACE_IAM,
		);
	}

	/**
	 * Gets available regions
	 *
	 * @return    array   Returns list of available regions
	 */
	static public function getAvailableRegions()
	{
		return array(
			self::REGION_AP_NORTHEAST_1,
			self::REGION_AP_SOUTHEAST_1,
			self::REGION_AP_SOUTHEAST_2,
			self::REGION_EU_WEST_1,
			self::REGION_SA_EAST_1,
			self::REGION_US_EAST_1,
			self::REGION_US_WEST_1,
			self::REGION_US_WEST_2
		);
	}

	/**
	 * Checks whether provided region is valid.
	 *
	 * @param    string    $region   AWS region  (Aws::REGION_US_EAST_1)
	 * @return   boolean   Returns boolean true if region is valid or false otherwise.
	 */
	static public function isValidRegion($region)
	{
		if (!in_array($region, self::getAvailableRegions())) {
			$ret = false;
		} else {
			$ret = true;
		}
		return $ret;
	}

	/**
	 * Gets reflection class of Aws
	 *
	 * @return \ReflectionClass  Returns reflection class of Aws
	 */
	static public function getReflectionClass()
	{
		if (!isset(self::$reflection)) {
			self::$reflection = new \ReflectionClass(__CLASS__);
		}
		return self::$reflection;
	}

	/**
	 * Magic getter
	 *
	 * @param     string      $name
	 * @return    mixed|null
	 */
	public function __get($name)
	{
		//Retrieves service provider object
		if (in_array(($n = lcfirst($name)), $this->getAvailableServiceInterfaces())) {
			if (!isset($this->serviceInterfaces[$n])) {
				//It validates region only for the services which it is necessary for.
				if (!in_array($n, array(self::SERVICE_INTERFACE_IAM, self::SERVICE_INTERFACE_S3))) {
					if (!self::isValidRegion($this->region)) {
						throw new AwsException(sprintf('Invalid region "%s" for the service "%s"', $this->region, $n));
					}
				}
				try {
					$class = __CLASS__ . '\\' . ucfirst($n);
					/* @var $service ServiceInterface */
					$service = new $class($this);
					$this->serviceInterfaces[$n] = $service;
				} catch (\Exception $e) {
					throw new AwsException('Cannot create service interface instance of ' . $class . ' ' . $e->getMessage());
				}
			} else {
				$service = $this->serviceInterfaces[$n];
			}
			return $service;
		}
		return null;
	}

	/**
	 * Gets Access Key Id
	 *
	 * @return string Returns Access Key Id
	 */
	public function getAccessKeyId()
	{
		return $this->accessKeyId;
	}

	/**
	 * Gets Secret Access Key
	 *
	 * @return string Returns Secret Access Key
	 */
	public function getSecretAccessKey()
	{
		return $this->secretAccessKey;
	}

	/**
	 * Calculates an MD5.Base64digest for the given string.
	 *
	 * @param   string     $string A string which should digest be calculated for.
	 * @return  string     Returns MD5 Base64 digest
	 */
	public static function getMd5Base64Digest ($string)
	{
		return base64_encode(pack('H*', md5($string)));
	}

	/**
	 * Calculates an MD5.Base64digest for the given file.
	 *
	 * @param   string     $file   A file path which should digest be calculated for.
	 * @return  string     Returns MD5 Base64 digest
	 */
	public static function getMd5Base64DigestFile ($file)
	{
		return base64_encode(pack('H*', md5_file($file)));
	}
}