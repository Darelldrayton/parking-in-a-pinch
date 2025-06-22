# Gunicorn configuration for production
import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Maximum requests a worker will process before restarting
max_requests = 1000
max_requests_jitter = 100

# Restart workers after this many seconds
max_worker_age = 3600

# Preload application for better performance
preload_app = True

# User and group to run the workers
user = "www-data"
group = "www-data"

# Process naming
proc_name = "parking-app"

# Logging
accesslog = "/var/log/parking-app/gunicorn-access.log"
errorlog = "/var/log/parking-app/gunicorn-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process IDs
pidfile = "/var/run/parking-app/gunicorn.pid"

# Temp directory
tmp_upload_dir = None

# SSL (if terminating SSL at Gunicorn instead of Nginx)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

def post_fork(server, worker):
    """Called after worker processes are forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_fork(server, worker):
    """Called before worker processes are forked."""
    pass

def worker_int(worker):
    """Called when a worker receives an INT or QUIT signal."""
    worker.log.info("worker received INT or QUIT signal")

def on_exit(server):
    """Called when gunicorn is about to exit."""
    server.log.info("Gunicorn is shutting down")

def on_reload(server):
    """Called when gunicorn is reloaded."""
    server.log.info("Gunicorn is reloading")