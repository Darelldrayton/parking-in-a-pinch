// Utility to fix all data issues with one click
export const fixAllDataIssues = async () => {
  try {
    const response = await fetch('https://www.parkinginapinch.com/api/v1/admin/fix-all-issues/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('🎯 Fix All Issues Response:', data);
    
    if (data.status === 'success') {
      console.log('✅ Issues Found:', data.results.issues_found);
      console.log('✅ Fixes Applied:', data.results.fixes_applied);
      console.log('✅ After Counts:', data.results.after_counts);
      console.log('✅ All Users:', data.results.all_users_details);
      
      // Reload the page to show new data
      setTimeout(() => window.location.reload(), 1000);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fixing data:', error);
    throw error;
  }
};

// Auto-run on page load if URL has ?fix=true
if (typeof window !== 'undefined' && window.location.search.includes('fix=true')) {
  console.log('🔧 Auto-fixing all data issues...');
  fixAllDataIssues();
}