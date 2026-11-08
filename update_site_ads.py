import os

# 1. Update the source Astro component so future builds are permanent
ASTRO_COMPONENT_PATH = os.path.join("src", "components", "MonetizationBox.astro")

NEW_ASTRO_CONTENT = """---
interface Props {
  city: string;
  state: string;
}

const { city, state } = Astro.props;
---
<div class="sticky top-4 bg-gradient-to-br from-navy-500 to-navy-700 text-white rounded-xl p-6 shadow-xl">
  <div class="flex items-center gap-2 mb-2">
    <span class="inline-block w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
    <span class="text-xs font-semibold uppercase tracking-wider text-amber-300">Verified Helpline</span>
  </div>
  <h3 class="text-lg font-bold mb-2">Care & Coverage Review</h3>
  <p class="text-sm text-navy-100 mb-5">
    Researching facilities in {city}, {state}? Speak with a licensed specialist to review your Medicare or health insurance benefits at no cost.
  </p>
  <div class="space-y-3">
    <a
      href="tel:18662277595"
      class="block w-full text-center bg-amber-400 hover:bg-amber-300 text-navy-900 font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow"
    >
      📞 Call (866) 227-7595<br />
      <span class="text-xs font-normal">Medicare & Benefits Review (Ages 64.5+)</span>
    </a>
    <a
      href="tel:18662284856"
      class="block w-full text-center bg-white hover:bg-gray-100 text-navy-700 font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow"
    >
      📞 Call (866) 228-4856<br />
      <span class="text-xs font-normal">Health Insurance Helpline (Ages 26–64)</span>
    </a>
  </div>
  <p class="text-[10px] text-navy-300 mt-4 text-center">
    Free, confidential consultation. We may receive referral compensation.
  </p>
</div>
"""

def update_astro_source():
    if os.path.exists(ASTRO_COMPONENT_PATH):
        with open(ASTRO_COMPONENT_PATH, "w", encoding="utf-8") as f:
            f.write(NEW_ASTRO_CONTENT)
        print(f"✅ Updated Astro source component: {ASTRO_COMPONENT_PATH}")
    else:
        print(f"⚠️ Could not find {ASTRO_COMPONENT_PATH}")

if __name__ == "__main__":
    update_astro_source()