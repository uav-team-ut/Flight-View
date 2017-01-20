import json
import sys

from .image_processing_files import process_image

print(json.dumps(process_image.get_targets(sys.argv[1])))
