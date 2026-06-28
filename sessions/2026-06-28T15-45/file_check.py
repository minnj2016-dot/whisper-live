# lint_test.py
   import os

   def check_file_exists(file_path):
       if not os.path.exists(file_path):
           print(f"WARNING: File '{file_path}' not found in the path.")
       else:
           print(f"File '{file_path}' exists and can be processed.")

   ```