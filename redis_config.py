import redis
import json
from datetime import timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis connection settings
REDIS_CONFIG = {
    'host': 'localhost',
    'port': 6379,
    'db': 0,
    'decode_responses': True
}

def get_redis_connection():
    """Create and return a Redis connection"""
    try:
        redis_client = redis.Redis(**REDIS_CONFIG)
        redis_client.ping()  # Test connection
        return redis_client
    except redis.ConnectionError as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        raise

# Cache TTLs (in seconds)
CACHE_TTL = {
    'inventory': 300,  # 5 minutes
    'bundle_performance': 600,  # 10 minutes
    'price_optimization': 1800,  # 30 minutes
    'customer_segments': 3600,  # 1 hour
}

# Key patterns
KEY_PATTERNS = {
    'inventory': 'inventory:{sku}',
    'bundle': 'bundle:{bundle_id}',
    'bundle_performance': 'bundle:performance:{bundle_id}',
    'customer_segment': 'customer:segment:{user_id}',
    'price_optimization': 'price:optimization:{bundle_id}'
}

def cache_inventory_data(inventory_data):
    """Cache inventory data in Redis"""
    redis_client = get_redis_connection()
    try:
        for item in inventory_data:
            key = KEY_PATTERNS['inventory'].format(sku=item['SKU'])
            redis_client.setex(
                key,
                CACHE_TTL['inventory'],
                json.dumps(item)
            )
        logger.info(f"Cached {len(inventory_data)} inventory items")
    except Exception as e:
        logger.error(f"Error caching inventory data: {str(e)}")
        raise

def get_cached_inventory(sku):
    """Get inventory data from Redis cache"""
    redis_client = get_redis_connection()
    try:
        key = KEY_PATTERNS['inventory'].format(sku=sku)
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.error(f"Error retrieving inventory data: {str(e)}")
        return None

def cache_bundle_performance(bundle_id, performance_data):
    """Cache bundle performance metrics"""
    redis_client = get_redis_connection()
    try:
        key = KEY_PATTERNS['bundle_performance'].format(bundle_id=bundle_id)
        redis_client.setex(
            key,
            CACHE_TTL['bundle_performance'],
            json.dumps(performance_data)
        )
        logger.info(f"Cached performance data for bundle {bundle_id}")
    except Exception as e:
        logger.error(f"Error caching bundle performance: {str(e)}")
        raise

def cache_price_optimization(bundle_id, optimization_data):
    """Cache price optimization results"""
    redis_client = get_redis_connection()
    try:
        key = KEY_PATTERNS['price_optimization'].format(bundle_id=bundle_id)
        redis_client.setex(
            key,
            CACHE_TTL['price_optimization'],
            json.dumps(optimization_data)
        )
        logger.info(f"Cached price optimization for bundle {bundle_id}")
    except Exception as e:
        logger.error(f"Error caching price optimization: {str(e)}")
        raise

def cache_customer_segment(user_id, segment_data):
    """Cache customer segment information"""
    redis_client = get_redis_connection()
    try:
        key = KEY_PATTERNS['customer_segment'].format(user_id=user_id)
        redis_client.setex(
            key,
            CACHE_TTL['customer_segments'],
            json.dumps(segment_data)
        )
        logger.info(f"Cached segment data for user {user_id}")
    except Exception as e:
        logger.error(f"Error caching customer segment: {str(e)}")
        raise 