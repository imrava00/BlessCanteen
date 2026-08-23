"""
Test Google Drive Integration
Run this script to verify your credentials are working correctly
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_google_drive_connection():
    """Test if Google Drive service can be initialized"""
    
    print("=" * 60)
    print("Google Drive Integration Test")
    print("=" * 60)
    
    # Check if credentials file exists
    credentials_file = 'credentials.json'
    
    if not os.path.exists(credentials_file):
        print("\n❌ ERROR: credentials.json not found!")
        print(f"\n   Looking for: {os.path.abspath(credentials_file)}")
        print("\n   Steps to fix:")
        print("   1. Go to Google Cloud Console")
        print("   2. Create a Service Account (see setup guide)")
        print("   3. Download JSON key file")
        print("   4. Rename it to 'credentials.json'")
        print("   5. Place it in: /home/z/my-project/school-cafe/")
        print("\n📄 Full setup guide: /home/z/my-project/download/google-drive-setup-guide.md")
        return False
    
    print(f"\n✅ Found credentials file: {credentials_file}")
    
    # Try to initialize the service
    try:
        from app import app
        
        with app.app_context():
            from app import get_google_drive_service
            
            print("\n🔌 Attempting to connect to Google Drive...")
            service = get_google_drive_service()
            
            if service:
                print("✅ SUCCESS! Connected to Google Drive API")
                
                # Test listing files (should return empty or files)
                print("\n📁 Testing file listing (service account's Drive)...")
                results = service.files().list(
                    pageSize=10,
                    fields="files(id, name)"
                ).execute()
                
                files = results.get('files', [])
                print(f"   Found {len(files)} existing files in Drive")
                
                # Test folder creation
                print("\n📂 Testing folder creation...")
                from app import get_or_create_drive_folder
                
                folder_id = get_or_create_drive_folder(service, "Test_Folder_SchoolCafe")
                
                if folder_id:
                    print(f"✅ Folder created/found! ID: {folder_id}")
                    
                    # Clean up - delete test folder
                    try:
                        service.files().delete(fileId=folder_id).execute()
                        print("🧹 Test folder cleaned up")
                    except:
                        pass  # Ignore cleanup errors
                
                print("\n" + "=" * 60)
                print("🎉 ALL TESTS PASSED!")
                print("=" * 60)
                print("\n✨ Your Google Drive integration is ready to use!")
                print("\nWhat happens next:")
                print("  • When users upload payment proofs, files will be saved to:")
                print("    School Cafe Payment Proofs/2026/August/")
                print("  • Files will be viewable via links returned by API")
                print("  • Local copies kept as backup in uploads/ folder")
                
                return True
            else:
                print("❌ FAILED: Could not initialize Drive service")
                print("\nPossible causes:")
                print("  • Invalid or corrupted credentials.json")
                print("  • Google Drive API not enabled")
                print("  • Network connectivity issues")
                return False
                
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\nMake sure required packages are installed:")
        print("  pip install google-api-python-client google-auth")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def show_credentials_info():
    """Show information about credentials file if it exists"""
    
    credentials_file = 'credentials.json'
    
    if os.path.exists(credentials_file):
        print("\n📋 Credentials File Info:")
        print(f"   Location: {os.path.abspath(credentials_file)}")
        print(f"   Size: {os.path.getsize(credentials_file)} bytes")
        
        try:
            import json
            with open(credentials_file, 'r') as f:
                creds = json.load(f)
                
            print(f"\n   Contents (safe to share):")
            print(f"   • Project ID: {creds.get('project_id', 'N/A')}")
            print(f"   • Client Email: {creds.get('client_email', 'N/A')}")
            print(f"   • Auth URI: {creds.get('auth_uri', 'N/A')}")
            print(f"   • Token URI: {creds.get('token_uri', 'N/A')}")
            
            print(f"\n   ⚠️  Keep this file secure and never share the private_key!")
            
        except json.JSONDecodeError:
            print("   ⚠️  File is not valid JSON")
    else:
        print(f"\n⚠️  No credentials file found at: {os.path.abspath(credentials_file)}")


if __name__ == '__main__':
    print("\n")
    show_credentials_info()
    success = test_google_drive_connection()
    sys.exit(0 if success else 1)
