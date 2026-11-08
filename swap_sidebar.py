import os
import re

# The complete Gumroad CTA replacement block
GUMROAD_BLOCK = """<div class="sticky top-4 bg-gradient-to-br from-navy-500 to-navy-700 text-white rounded-xl p-6 shadow-xl">
  <div class="flex items-center gap-2 mb-2">
    <span class="inline-block w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></span>
    <span class="text-xs font-semibold uppercase tracking-wider text-amber-300">Essential Guide</span>
  </div>
  <h3 class="text-lg font-bold mb-2">The Nursing Home Safety & Transition Checklist</h3>
  <p class="text-sm text-navy-100 mb-5">Don't risk your loved one's safety. Learn the 20 hidden red flags to look for and exactly how to transition to a safe facility.</p>
  
  <div class="space-y-3">
    <a href="https://gumroad.com/" target="_blank" class="block w-full text-center bg-amber-400 hover:bg-amber-300 text-navy-900 font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow">
      📥 Download Instantly - $9.99
    </a>
  </div>
  
  <div class="mt-4 flex items-center justify-center gap-2 text-[10px] text-navy-300">
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
    </svg>
    <span>Secure Checkout via Gumroad</span>
  </div>
</div>"""

# Regex to find the exact MarketCall block boundaries based on your HTML structure
regex_pattern = re.compile(
    r'<div class="sticky top-4 bg-gradient-to-br from-navy-500 to-navy-700 text-white rounded-xl p-6 shadow-xl">.*?'
    r'<p class="text-\[10px\] text-navy-300 mt-4 text-center">Free, confidential consultation\. We may receive referral compensation\.</p>\s*</div>',
    re.DOTALL
)

def run_replacement():
    project_dir = os.path.join(os.getcwd(), "src")
    
    if not os.path.exists(project_dir):
        print("Error: Could not find 'src' directory. Make sure you run this in the root of SeniorHomeViolations.com.")
        return

    match_count = 0
    
    # Walk through all directories inside /src
    for root, dirs, files in os.walk(project_dir):
        for file in files:
            if file.endswith('.astro'):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # If the MarketCall block is found, replace it
                if regex_pattern.search(content):
                    new_content = regex_pattern.sub(GUMROAD_BLOCK, content)
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                        
                    print(f"✅ Updated: {file_path}")
                    match_count += 1
                    
    print(f"\nFinished! Successfully replaced the sidebar in {match_count} files.")

if __name__ == "__main__":
    run_replacement()