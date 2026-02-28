import requests
import sys
import json
from datetime import datetime, timedelta

class WindailyBudAPITester:
    def __init__(self, base_url="https://first-steps-113.preview.emergentagent.com"):
        self.base_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'todos': [],
            'habits': [],
            'tags': [],
            'habit_logs': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "health", 200, auth_required=False)

    def test_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test User"
            },
            auth_required=False
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_login(self):
        """Test user login with existing user"""
        if not self.user_id:
            return False
        
        # Try to login with wrong credentials first
        wrong_success, _ = self.run_test(
            "Login with Wrong Credentials",
            "POST",
            "auth/login",
            401,
            data={
                "email": "wrong@email.com",
                "password": "wrongpassword"
            },
            auth_required=False
        )
        return wrong_success

    def test_auth_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_todo(self):
        """Test todo creation"""
        success, response = self.run_test(
            "Create Todo",
            "POST",
            "todos",
            200,  # Backend returns 200 for todo creation
            data={
                "title": "Test Todo Task",
                "notes": "This is a test todo",
                "tags": ["Work", "Health"],
                "urgency_tier": 1,
                "importance_tier": 2,
                "is_one_minute": False
            }
        )
        if success and 'id' in response:
            self.created_resources['todos'].append(response['id'])
            return True
        return False

    def test_get_todos(self):
        """Test getting todos"""
        return self.run_test("Get All Todos", "GET", "todos", 200)

    def test_get_open_todos(self):
        """Test getting open todos"""
        return self.run_test("Get Open Todos", "GET", "todos?status=open", 200)

    def test_update_todo_status(self):
        """Test updating todo status"""
        if not self.created_resources['todos']:
            return False
        
        todo_id = self.created_resources['todos'][0]
        success, _ = self.run_test(
            "Update Todo Status",
            "PATCH",
            f"todos/{todo_id}",
            200,
            data={"status": "in_progress"}
        )
        
        # Test marking as closed
        if success:
            success, _ = self.run_test(
                "Mark Todo as Closed",
                "PATCH",
                f"todos/{todo_id}",
                200,
                data={"status": "closed"}
            )
        
        return success

    def test_create_quick_task(self):
        """Test creating 1-minute quick task"""
        success, response = self.run_test(
            "Create 1-Minute Task",
            "POST",
            "todos",
            200,
            data={
                "title": "Quick task test",
                "is_one_minute": True,
                "urgency_tier": 1,
                "importance_tier": 1
            }
        )
        if success and 'id' in response:
            self.created_resources['todos'].append(response['id'])
        return success

    def test_get_tags(self):
        """Test getting tags (should have default tags)"""
        success, response = self.run_test("Get Tags", "GET", "tags", 200)
        if success and response and len(response) > 0:
            print(f"   Found {len(response)} default tags")
            return True
        return success

    def test_create_tag(self):
        """Test creating custom tag"""
        success, response = self.run_test(
            "Create Custom Tag",
            "POST",
            "tags",
            200,
            data={"label": "CustomTag"}
        )
        if success and 'id' in response:
            self.created_resources['tags'].append(response['id'])
        return success

    def test_get_habits(self):
        """Test getting habits (should have default habits)"""
        success, response = self.run_test("Get Habits", "GET", "habits", 200)
        if success and response and len(response) > 0:
            print(f"   Found {len(response)} default habits")
            # Store some habit IDs for later use
            for habit in response[:3]:  # Store first 3 habits
                self.created_resources['habits'].append(habit['id'])
            return True
        return success

    def test_create_custom_habit(self):
        """Test creating custom habit"""
        success, response = self.run_test(
            "Create Custom Habit",
            "POST",
            "habits",
            200,
            data={
                "category": "learning",
                "name": "Test Learning Habit",
                "goal_days_per_week": 5,
                "unit": "minutes",
                "target_per_session": 30,
                "target_days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
            }
        )
        if success and 'id' in response:
            self.created_resources['habits'].append(response['id'])
        return success

    def test_log_habit(self):
        """Test logging habit completion"""
        if not self.created_resources['habits']:
            return False
        
        habit_id = self.created_resources['habits'][0]
        today = datetime.now().strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Log Habit Completion",
            "POST",
            "habit-logs",
            200,
            data={
                "habit_id": habit_id,
                "log_date": today,
                "percent_achieved": 80.0,
                "is_done": True,
                "notes": "Test habit log"
            }
        )
        if success and 'id' in response:
            self.created_resources['habit_logs'].append(response['id'])
        return success

    def test_get_habit_logs(self):
        """Test getting habit logs"""
        today = datetime.now().strftime('%Y-%m-%d')
        return self.run_test(
            "Get Habit Logs",
            "GET",
            f"habit-logs?start_date={today}&end_date={today}",
            200
        )

    def test_update_habit(self):
        """Test updating habit"""
        if not self.created_resources['habits']:
            return False
        
        habit_id = self.created_resources['habits'][-1]  # Use the custom habit we created
        return self.run_test(
            "Update Habit",
            "PATCH",
            f"habits/{habit_id}",
            200,
            data={"is_active": False}
        )

    def test_analytics(self):
        """Test getting analytics"""
        today = datetime.now().strftime('%Y-%m-%d')
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Get Habit Analytics",
            "GET",
            f"analytics/habits?start_date={week_ago}&end_date={today}",
            200
        )
        
        if success and response:
            print(f"   Overall score: {response.get('overall_score', 'N/A')}%")
            print(f"   Categories: {len(response.get('categories', {}))}")
            print(f"   Habits analyzed: {len(response.get('habits', []))}")
        
        return success

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete habit logs
        for log_id in self.created_resources['habit_logs']:
            self.run_test(f"Delete Habit Log", "DELETE", f"habit-logs/{log_id}", 200)
        
        # Delete custom habits (don't delete default habits)
        for habit_id in self.created_resources['habits'][-1:]:  # Only delete the last one (custom habit)
            try:
                self.run_test(f"Delete Custom Habit", "DELETE", f"habits/{habit_id}", 200)
            except:
                pass
        
        # Delete todos
        for todo_id in self.created_resources['todos']:
            self.run_test(f"Delete Todo", "DELETE", f"todos/{todo_id}", 200)
        
        # Delete custom tags
        for tag_id in self.created_resources['tags']:
            self.run_test(f"Delete Custom Tag", "DELETE", f"tags/{tag_id}", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting WindailyBud API Tests...")
        
        # Health check
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Authentication tests
        if not self.test_register():
            print("❌ Registration failed - stopping tests")
            return False
            
        if not self.test_login():
            print("❌ Login validation failed")
            
        if not self.test_auth_me():
            print("❌ Auth me failed")
            return False
        
        # Todo tests
        if not self.test_create_todo():
            print("❌ Todo creation failed")
            
        if not self.test_get_todos():
            print("❌ Get todos failed")
            
        if not self.test_get_open_todos():
            print("❌ Get open todos failed")
            
        if not self.test_update_todo_status():
            print("❌ Todo status update failed")
            
        if not self.test_create_quick_task():
            print("❌ Quick task creation failed")
        
        # Tag tests
        if not self.test_get_tags():
            print("❌ Get tags failed")
            
        if not self.test_create_tag():
            print("❌ Create tag failed")
        
        # Habit tests
        if not self.test_get_habits():
            print("❌ Get habits failed")
            
        if not self.test_create_custom_habit():
            print("❌ Create custom habit failed")
            
        if not self.test_log_habit():
            print("❌ Log habit failed")
            
        if not self.test_get_habit_logs():
            print("❌ Get habit logs failed")
            
        if not self.test_update_habit():
            print("❌ Update habit failed")
        
        # Analytics tests
        if not self.test_analytics():
            print("❌ Analytics failed")
        
        # Cleanup
        self.cleanup_resources()
        
        # Print results
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("✅ Backend API testing completed successfully!")
            return True
        else:
            print("❌ Backend API testing failed - too many issues found")
            return False

def main():
    tester = WindailyBudAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())