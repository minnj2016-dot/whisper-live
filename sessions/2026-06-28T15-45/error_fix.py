# lint_test.py
   def check_syntax(file_path):
       with open(file_path, 'r') as file:
           lines = file.readlines()
           for i, line in enumerate(lines):
               if 'invalid syntax' in line:
                   print(f"Line {i+1}: SyntaxError: invalid syntax")
               else:
                   print(f"Line {i+1}: No syntax errors found.")
   ```