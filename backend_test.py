#!/usr/bin/env python3
"""
NewsDesk News Portal Backend API Testing Script
Tests all backend API endpoints for functionality and data integrity.
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://newsdesk-api.preview.emergentagent.com/api"

class NewsPortalTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.created_news_id = None
        self.created_category_id = None
        self.created_user_id = None
        self.seeded_news_ids = []

    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response_data'] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_result("Health Check", True, "Health endpoint working correctly", data)
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
        return False

    def test_seed_data(self):
        """Test seeding default data"""
        try:
            response = self.session.post(f"{BASE_URL}/seed")
            if response.status_code == 200:
                data = response.json()
                if data.get('success') or 'Already seeded' in data.get('message', ''):
                    self.log_result("Seed Data", True, "Database seeded successfully", data)
                    return True
                else:
                    self.log_result("Seed Data", False, f"Seed failed: {data}")
            else:
                self.log_result("Seed Data", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Seed Data", False, f"Exception: {str(e)}")
        return False

    def test_get_categories(self):
        """Test getting public categories"""
        try:
            response = self.session.get(f"{BASE_URL}/categories")
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', [])
                if len(categories) > 0:
                    self.log_result("Get Categories", True, f"Retrieved {len(categories)} categories", {'count': len(categories)})
                    return True
                else:
                    self.log_result("Get Categories", False, "No categories found")
            else:
                self.log_result("Get Categories", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Get Categories", False, f"Exception: {str(e)}")
        return False

    def test_get_news_list(self):
        """Test getting published news list"""
        try:
            response = self.session.get(f"{BASE_URL}/news")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                pagination = data.get('pagination', {})
                if len(news) > 0:
                    # Store some news IDs for later tests
                    self.seeded_news_ids = [article['id'] for article in news[:3]]
                    self.log_result("Get News List", True, f"Retrieved {len(news)} news articles", {
                        'count': len(news),
                        'pagination': pagination
                    })
                    return True
                else:
                    self.log_result("Get News List", False, "No news articles found")
            else:
                self.log_result("Get News List", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Get News List", False, f"Exception: {str(e)}")
        return False

    def test_get_news_with_category_filter(self):
        """Test news filtering by category"""
        try:
            response = self.session.get(f"{BASE_URL}/news?category=technology")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                self.log_result("News Category Filter", True, f"Retrieved {len(news)} technology news", {'count': len(news)})
                return True
            else:
                self.log_result("News Category Filter", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("News Category Filter", False, f"Exception: {str(e)}")
        return False

    def test_get_news_with_search(self):
        """Test news search functionality"""
        try:
            response = self.session.get(f"{BASE_URL}/news?search=AI")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                self.log_result("News Search", True, f"Search returned {len(news)} results", {'count': len(news)})
                return True
            else:
                self.log_result("News Search", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("News Search", False, f"Exception: {str(e)}")
        return False

    def test_get_breaking_news(self):
        """Test getting breaking news"""
        try:
            response = self.session.get(f"{BASE_URL}/news/breaking")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                self.log_result("Breaking News", True, f"Retrieved {len(news)} breaking news", {'count': len(news)})
                return True
            else:
                self.log_result("Breaking News", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Breaking News", False, f"Exception: {str(e)}")
        return False

    def test_get_single_news(self):
        """Test getting single news article"""
        if not self.seeded_news_ids:
            self.log_result("Get Single News", False, "No news IDs available for testing")
            return False
            
        try:
            news_id = self.seeded_news_ids[0]
            response = self.session.get(f"{BASE_URL}/news/{news_id}")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news')
                if news and news.get('id') == news_id:
                    self.log_result("Get Single News", True, f"Retrieved news article: {news.get('title', 'Unknown')}")
                    return True
                else:
                    self.log_result("Get Single News", False, "Invalid news data returned")
            else:
                self.log_result("Get Single News", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Get Single News", False, f"Exception: {str(e)}")
        return False

    def test_admin_get_all_news(self):
        """Test admin endpoint to get all news including drafts"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/news")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                pagination = data.get('pagination', {})
                self.log_result("Admin Get All News", True, f"Retrieved {len(news)} news articles (all statuses)", {
                    'count': len(news),
                    'pagination': pagination
                })
                return True
            else:
                self.log_result("Admin Get All News", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Admin Get All News", False, f"Exception: {str(e)}")
        return False

    def test_admin_get_news_by_status(self):
        """Test admin endpoint to filter news by status"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/news?status=published")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                self.log_result("Admin Filter News by Status", True, f"Retrieved {len(news)} published news", {'count': len(news)})
                return True
            else:
                self.log_result("Admin Filter News by Status", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Admin Filter News by Status", False, f"Exception: {str(e)}")
        return False

    def test_create_news_article(self):
        """Test creating a new news article"""
        try:
            article_data = {
                "title": "Test Article for API Testing",
                "content": "This is a comprehensive test article created to verify the news creation API endpoint functionality. It contains detailed content to ensure proper handling of article data.",
                "category": "technology",
                "status": "draft",
                "authorName": "API Test Author",
                "tags": ["test", "api", "automation"],
                "excerpt": "Test article for API endpoint verification"
            }
            
            response = self.session.post(f"{BASE_URL}/admin/news", json=article_data)
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('news'):
                    self.created_news_id = data['news']['id']
                    self.log_result("Create News Article", True, f"Created article: {data['news']['title']}", {
                        'id': self.created_news_id,
                        'title': data['news']['title']
                    })
                    return True
                else:
                    self.log_result("Create News Article", False, f"Unexpected response: {data}")
            else:
                self.log_result("Create News Article", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Create News Article", False, f"Exception: {str(e)}")
        return False

    def test_update_news_article(self):
        """Test updating a news article"""
        if not self.created_news_id:
            self.log_result("Update News Article", False, "No created article ID available")
            return False
            
        try:
            update_data = {
                "title": "Updated Test Article for API Testing",
                "content": "This article has been updated to test the PUT endpoint functionality.",
                "status": "pending"
            }
            
            response = self.session.put(f"{BASE_URL}/admin/news/{self.created_news_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Update News Article", True, "Article updated successfully")
                    return True
                else:
                    self.log_result("Update News Article", False, f"Update failed: {data}")
            else:
                self.log_result("Update News Article", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Update News Article", False, f"Exception: {str(e)}")
        return False

    def test_approve_news_article(self):
        """Test approving a news article"""
        if not self.created_news_id:
            self.log_result("Approve News Article", False, "No created article ID available")
            return False
            
        try:
            approval_data = {
                "userId": "test-user-id",
                "userName": "Test Editor",
                "comment": "Approved for testing purposes"
            }
            
            response = self.session.post(f"{BASE_URL}/admin/news/{self.created_news_id}/approve", json=approval_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Approve News Article", True, "Article approved successfully")
                    return True
                else:
                    self.log_result("Approve News Article", False, f"Approval failed: {data}")
            else:
                self.log_result("Approve News Article", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Approve News Article", False, f"Exception: {str(e)}")
        return False

    def test_reject_news_article(self):
        """Test rejecting a news article"""
        if not self.created_news_id:
            self.log_result("Reject News Article", False, "No created article ID available")
            return False
            
        try:
            rejection_data = {
                "userId": "test-user-id",
                "userName": "Test Editor",
                "comment": "Rejected for testing purposes"
            }
            
            response = self.session.post(f"{BASE_URL}/admin/news/{self.created_news_id}/reject", json=rejection_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Reject News Article", True, "Article rejected successfully")
                    return True
                else:
                    self.log_result("Reject News Article", False, f"Rejection failed: {data}")
            else:
                self.log_result("Reject News Article", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Reject News Article", False, f"Exception: {str(e)}")
        return False

    def test_admin_get_categories(self):
        """Test admin categories endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/categories")
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', [])
                self.log_result("Admin Get Categories", True, f"Retrieved {len(categories)} categories", {'count': len(categories)})
                return True
            else:
                self.log_result("Admin Get Categories", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Admin Get Categories", False, f"Exception: {str(e)}")
        return False

    def test_create_category(self):
        """Test creating a new category"""
        try:
            category_data = {
                "name": "Test Category",
                "description": "Category created for API testing",
                "color": "#FF5722",
                "order": 99,
                "isActive": True
            }
            
            response = self.session.post(f"{BASE_URL}/admin/categories", json=category_data)
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('category'):
                    self.created_category_id = data['category']['id']
                    self.log_result("Create Category", True, f"Created category: {data['category']['name']}", {
                        'id': self.created_category_id,
                        'name': data['category']['name']
                    })
                    return True
                else:
                    self.log_result("Create Category", False, f"Unexpected response: {data}")
            else:
                self.log_result("Create Category", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Create Category", False, f"Exception: {str(e)}")
        return False

    def test_update_category(self):
        """Test updating a category"""
        if not self.created_category_id:
            self.log_result("Update Category", False, "No created category ID available")
            return False
            
        try:
            update_data = {
                "name": "Updated Test Category",
                "description": "Updated description for testing",
                "color": "#4CAF50"
            }
            
            response = self.session.put(f"{BASE_URL}/admin/categories/{self.created_category_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Update Category", True, "Category updated successfully")
                    return True
                else:
                    self.log_result("Update Category", False, f"Update failed: {data}")
            else:
                self.log_result("Update Category", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Update Category", False, f"Exception: {str(e)}")
        return False

    def test_admin_get_users(self):
        """Test admin users endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/users")
            if response.status_code == 200:
                data = response.json()
                users = data.get('users', [])
                self.log_result("Admin Get Users", True, f"Retrieved {len(users)} users", {'count': len(users)})
                return True
            else:
                self.log_result("Admin Get Users", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Admin Get Users", False, f"Exception: {str(e)}")
        return False

    def test_create_user(self):
        """Test creating a new user"""
        try:
            user_data = {
                "email": "testuser@newsdesk.com",
                "name": "Test User",
                "role": "reporter",
                "bio": "Test user created for API testing"
            }
            
            response = self.session.post(f"{BASE_URL}/admin/users", json=user_data)
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.created_user_id = data['user']['id']
                    self.log_result("Create User", True, f"Created user: {data['user']['name']}", {
                        'id': self.created_user_id,
                        'name': data['user']['name'],
                        'email': data['user']['email']
                    })
                    return True
                else:
                    self.log_result("Create User", False, f"Unexpected response: {data}")
            else:
                self.log_result("Create User", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Create User", False, f"Exception: {str(e)}")
        return False

    def test_analytics(self):
        """Test analytics endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/analytics")
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                top_articles = data.get('topArticles', [])
                if stats:
                    self.log_result("Analytics", True, f"Retrieved analytics data", {
                        'stats': stats,
                        'top_articles_count': len(top_articles)
                    })
                    return True
                else:
                    self.log_result("Analytics", False, "No analytics data returned")
            else:
                self.log_result("Analytics", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Analytics", False, f"Exception: {str(e)}")
        return False

    def test_user_sync(self):
        """Test user sync from Firebase"""
        try:
            sync_data = {
                "firebaseUid": "test-firebase-uid-123",
                "email": "synctest@newsdesk.com",
                "name": "Sync Test User",
                "avatar": "https://example.com/avatar.jpg"
            }
            
            response = self.session.post(f"{BASE_URL}/users/sync", json=sync_data)
            if response.status_code in [200, 201]:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.log_result("User Sync", True, f"Synced user: {data['user']['name']}", {
                        'user_id': data['user']['id'],
                        'is_new': data.get('isNew', False)
                    })
                    return True
                else:
                    self.log_result("User Sync", False, f"Unexpected response: {data}")
            else:
                self.log_result("User Sync", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("User Sync", False, f"Exception: {str(e)}")
        return False

    def test_share_tracking(self):
        """Test share tracking functionality"""
        if not self.seeded_news_ids:
            self.log_result("Share Tracking", False, "No news IDs available for testing")
            return False
            
        try:
            news_id = self.seeded_news_ids[0]
            share_data = {"platform": "whatsapp"}
            
            response = self.session.post(f"{BASE_URL}/news/{news_id}/share", json=share_data)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Share Tracking", True, "Share tracked successfully")
                    return True
                else:
                    self.log_result("Share Tracking", False, f"Share tracking failed: {data}")
            else:
                self.log_result("Share Tracking", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Share Tracking", False, f"Exception: {str(e)}")
        return False

    def test_cloudinary_signature(self):
        """Test Cloudinary signature generation"""
        try:
            response = self.session.get(f"{BASE_URL}/cloudinary/signature?folder=news&resource_type=image")
            if response.status_code == 200:
                data = response.json()
                if 'signature' in data and 'timestamp' in data:
                    self.log_result("Cloudinary Signature", True, "Signature generated successfully", {
                        'has_signature': True,
                        'has_timestamp': True
                    })
                    return True
                else:
                    self.log_result("Cloudinary Signature", False, f"Invalid signature response: {data}")
            else:
                self.log_result("Cloudinary Signature", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Cloudinary Signature", False, f"Exception: {str(e)}")
        return False

    def test_pagination(self):
        """Test pagination functionality"""
        try:
            response = self.session.get(f"{BASE_URL}/news?page=1&limit=2")
            if response.status_code == 200:
                data = response.json()
                news = data.get('news', [])
                pagination = data.get('pagination', {})
                
                if len(news) <= 2 and pagination.get('page') == 1 and pagination.get('limit') == 2:
                    self.log_result("Pagination", True, f"Pagination working correctly", {
                        'returned_count': len(news),
                        'pagination': pagination
                    })
                    return True
                else:
                    self.log_result("Pagination", False, f"Pagination not working correctly: {pagination}")
            else:
                self.log_result("Pagination", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Pagination", False, f"Exception: {str(e)}")
        return False

    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        cleanup_results = []
        
        # Delete test news article
        if self.created_news_id:
            try:
                response = self.session.delete(f"{BASE_URL}/admin/news/{self.created_news_id}")
                if response.status_code == 200:
                    cleanup_results.append("✅ Deleted test news article")
                else:
                    cleanup_results.append(f"❌ Failed to delete test news article: {response.status_code}")
            except Exception as e:
                cleanup_results.append(f"❌ Error deleting test news article: {str(e)}")
        
        # Delete test category
        if self.created_category_id:
            try:
                response = self.session.delete(f"{BASE_URL}/admin/categories/{self.created_category_id}")
                if response.status_code == 200:
                    cleanup_results.append("✅ Deleted test category")
                else:
                    cleanup_results.append(f"❌ Failed to delete test category: {response.status_code}")
            except Exception as e:
                cleanup_results.append(f"❌ Error deleting test category: {str(e)}")
        
        # Delete test user
        if self.created_user_id:
            try:
                response = self.session.delete(f"{BASE_URL}/admin/users/{self.created_user_id}")
                if response.status_code == 200:
                    cleanup_results.append("✅ Deleted test user")
                else:
                    cleanup_results.append(f"❌ Failed to delete test user: {response.status_code}")
            except Exception as e:
                cleanup_results.append(f"❌ Error deleting test user: {str(e)}")
        
        if cleanup_results:
            print("\n" + "="*50)
            print("CLEANUP RESULTS:")
            for result in cleanup_results:
                print(result)

    def run_all_tests(self):
        """Run all backend API tests"""
        print("="*60)
        print("NEWSDESK NEWS PORTAL - BACKEND API TESTING")
        print("="*60)
        print(f"Testing against: {BASE_URL}")
        print(f"Started at: {datetime.now().isoformat()}")
        print("="*60)

        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Seed Data", self.test_seed_data),
            ("Get Categories", self.test_get_categories),
            ("Get News List", self.test_get_news_list),
            ("News Category Filter", self.test_get_news_with_category_filter),
            ("News Search", self.test_get_news_with_search),
            ("Breaking News", self.test_get_breaking_news),
            ("Get Single News", self.test_get_single_news),
            ("Admin Get All News", self.test_admin_get_all_news),
            ("Admin Filter News by Status", self.test_admin_get_news_by_status),
            ("Create News Article", self.test_create_news_article),
            ("Update News Article", self.test_update_news_article),
            ("Approve News Article", self.test_approve_news_article),
            ("Reject News Article", self.test_reject_news_article),
            ("Admin Get Categories", self.test_admin_get_categories),
            ("Create Category", self.test_create_category),
            ("Update Category", self.test_update_category),
            ("Admin Get Users", self.test_admin_get_users),
            ("Create User", self.test_create_user),
            ("Analytics", self.test_analytics),
            ("User Sync", self.test_user_sync),
            ("Share Tracking", self.test_share_tracking),
            ("Cloudinary Signature", self.test_cloudinary_signature),
            ("Pagination", self.test_pagination),
        ]

        passed = 0
        failed = 0

        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error - {str(e)}")
                failed += 1

        # Cleanup test data
        self.cleanup_test_data()

        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {passed + failed}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        print(f"Completed at: {datetime.now().isoformat()}")
        print("="*60)

        return passed, failed, self.test_results

if __name__ == "__main__":
    tester = NewsPortalTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)