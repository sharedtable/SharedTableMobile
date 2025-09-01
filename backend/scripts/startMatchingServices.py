#!/usr/bin/env python3
"""
Start the SharedTableMatchingAlgorithm services
"""

import subprocess
import time
import os
import sys
import socket
from pathlib import Path

# Service configuration
SERVICES = [
    {
        'name': 'data-processor',
        'port': 8001,
        'path': '/Users/jingzhougaryxue/CascadeProjects/SharedTableMatchingAlgorithm/services/data-processor'
    },
    {
        'name': 'people-matcher',
        'port': 8002,
        'path': '/Users/jingzhougaryxue/CascadeProjects/SharedTableMatchingAlgorithm/services/people-matcher'
    },
    {
        'name': 'restaurant-matcher',
        'port': 8003,
        'path': '/Users/jingzhougaryxue/CascadeProjects/SharedTableMatchingAlgorithm/services/restaurant-matcher'
    }
]

def is_port_open(port):
    """Check if a port is already in use"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def start_service(service):
    """Start a single service"""
    name = service['name']
    port = service['port']
    path = Path(service['path'])
    
    print(f"\n🔄 Starting {name} on port {port}...")
    
    # Check if already running
    if is_port_open(port):
        print(f"✅ {name} already running on port {port}")
        return True
    
    # Check if path exists
    if not path.exists():
        print(f"❌ Service directory not found: {path}")
        return False
    
    # Change to service directory
    original_dir = os.getcwd()
    os.chdir(path)
    
    try:
        # Start the service
        log_file = open(f"{name}.log", "w")
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", str(port)],
            stdout=log_file,
            stderr=log_file,
            start_new_session=True
        )
        
        # Wait for service to start
        for i in range(10):
            time.sleep(1)
            if is_port_open(port):
                print(f"✅ {name} started successfully on port {port}")
                print(f"   PID: {process.pid}")
                print(f"   Logs: {path / f'{name}.log'}")
                return True
        
        print(f"⚠️  {name} may be starting slowly, check logs at {path / f'{name}.log'}")
        return False
        
    except Exception as e:
        print(f"❌ Failed to start {name}: {e}")
        return False
    finally:
        os.chdir(original_dir)

def main():
    print("🚀 Starting SharedTable Matching Algorithm Services")
    print("=" * 50)
    
    success_count = 0
    
    for service in SERVICES:
        if start_service(service):
            success_count += 1
    
    print("\n" + "=" * 50)
    if success_count == len(SERVICES):
        print("✅ All services started successfully!")
    else:
        print(f"⚠️  Started {success_count}/{len(SERVICES)} services")
    
    print("\nService URLs:")
    print("  - Data Processor:     http://localhost:8001/docs")
    print("  - People Matcher:     http://localhost:8002/docs")
    print("  - Restaurant Matcher: http://localhost:8003/docs")
    
    print("\nTo run matching: npx tsx scripts/runMatching.ts")

if __name__ == "__main__":
    main()