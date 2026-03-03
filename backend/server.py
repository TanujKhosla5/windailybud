from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'windailybud-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="WindailyBud API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Todo Models
class TodoCreate(BaseModel):
    title: str
    notes: Optional[str] = None
    tags: List[str] = []
    urgency_tier: int = 3
    urgency_date: Optional[str] = None
    importance_tier: int = 3
    importance_date: Optional[str] = None
    is_one_minute: bool = False

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    urgency_tier: Optional[int] = None
    urgency_date: Optional[str] = None
    importance_tier: Optional[int] = None
    importance_date: Optional[str] = None
    status: Optional[str] = None

class TodoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    notes: Optional[str] = None
    tags: List[str] = []
    urgency_tier: int
    urgency_date: Optional[str] = None
    importance_tier: int
    importance_date: Optional[str] = None
    status: str
    is_one_minute: bool
    closed_at: Optional[str] = None
    created_at: str
    updated_at: str

# Tag Models
class TagCreate(BaseModel):
    label: str

class TagResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    label: str
    is_default: bool
    created_at: str

# Habit Models
class HabitCreate(BaseModel):
    category: str
    name: str
    goal_days_per_week: int = 7
    unit: str = "count"
    target_per_session: float = 1
    target_days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dose_tablets: Optional[int] = None
    dose_per_tablet: Optional[float] = None
    dose_unit: Optional[str] = None
    water_target: Optional[float] = None
    water_unit: Optional[str] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    goal_days_per_week: Optional[int] = None
    unit: Optional[str] = None
    target_per_session: Optional[float] = None
    target_days: Optional[List[str]] = None
    is_active: Optional[bool] = None
    dose_tablets: Optional[int] = None
    dose_per_tablet: Optional[float] = None
    dose_unit: Optional[str] = None
    water_target: Optional[float] = None
    water_unit: Optional[str] = None

class HabitResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    category: str
    name: str
    is_default: bool
    is_active: bool
    goal_days_per_week: int
    unit: str
    target_per_session: float
    target_days: List[str]
    dose_tablets: Optional[int] = None
    dose_per_tablet: Optional[float] = None
    dose_unit: Optional[str] = None
    water_target: Optional[float] = None
    water_unit: Optional[str] = None
    created_at: str
    updated_at: str

# Habit Log Models
class HabitLogCreate(BaseModel):
    habit_id: str
    log_date: str
    percent_achieved: float = 100
    is_done: bool = True
    notes: Optional[str] = None

class HabitLogUpdate(BaseModel):
    percent_achieved: Optional[float] = None
    is_done: Optional[bool] = None
    notes: Optional[str] = None

class HabitLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    habit_id: str
    user_id: str
    log_date: str
    percent_achieved: float
    is_done: bool
    notes: Optional[str] = None
    created_at: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== DEFAULT DATA ==============

DEFAULT_TAGS = ["Work", "Health", "Kids", "Home", "Investments", "Social"]

DEFAULT_HABITS = {
    "supplementation": [
        {"name": "Royal Jelly", "unit": "count", "target_per_session": 1},
        {"name": "NMN", "unit": "count", "target_per_session": 1},
        {"name": "Folate", "unit": "count", "target_per_session": 1},
        {"name": "Vitamin D", "unit": "count", "target_per_session": 1},
        {"name": "AKG", "unit": "count", "target_per_session": 1},
        {"name": "Berberine", "unit": "count", "target_per_session": 1},
        {"name": "Omega 3", "unit": "count", "target_per_session": 1},
        {"name": "Magnesium Glycinate", "unit": "count", "target_per_session": 1},
        {"name": "Protein Shake", "unit": "count", "target_per_session": 1},
        {"name": "Creatine", "unit": "count", "target_per_session": 1},
    ],
    "physical": [
        {"name": "Running", "unit": "km", "target_per_session": 5},
        {"name": "Strength Training", "unit": "minutes", "target_per_session": 45},
        {"name": "Night Push-Ups", "unit": "reps", "target_per_session": 50},
        {"name": "Grip Strength", "unit": "minutes", "target_per_session": 5},
        {"name": "Night Squats", "unit": "reps", "target_per_session": 30},
    ],
    "brain": [
        {"name": "SuDoku", "unit": "minutes", "target_per_session": 15},
        {"name": "Lumosity", "unit": "minutes", "target_per_session": 10},
        {"name": "Rubik's Cube", "unit": "minutes", "target_per_session": 10},
        {"name": "Juggling", "unit": "minutes", "target_per_session": 10},
        {"name": "Reading", "unit": "minutes", "target_per_session": 30},
    ],
    "lung": [
        {"name": "Aerofit", "unit": "minutes", "target_per_session": 10},
    ],
    "mental": [
        {"name": "Meditation", "unit": "minutes", "target_per_session": 15},
        {"name": "Manifestation", "unit": "minutes", "target_per_session": 5},
        {"name": "Hanuman Chalisa", "unit": "count", "target_per_session": 1},
        {"name": "Shukr Beej Mantra", "unit": "count", "target_per_session": 1},
    ],
    "social": [
        {"name": "Call Friends", "unit": "count", "target_per_session": 1},
        {"name": "Message Friends", "unit": "count", "target_per_session": 3},
    ],
    "learning": [
        {"name": "Watch Sports Videos", "unit": "minutes", "target_per_session": 20},
        {"name": "Read", "unit": "minutes", "target_per_session": 30},
    ],
}

async def seed_default_data(user_id: str):
    # Create default tags
    for label in DEFAULT_TAGS:
        existing = await db.tags.find_one({'user_id': user_id, 'label': label})
        if not existing:
            tag = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'label': label,
                'is_default': True,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await db.tags.insert_one(tag)
    
    # Create default habits
    for category, habits in DEFAULT_HABITS.items():
        for habit_data in habits:
            existing = await db.habits.find_one({'user_id': user_id, 'category': category, 'name': habit_data['name']})
            if not existing:
                habit = {
                    'id': str(uuid.uuid4()),
                    'user_id': user_id,
                    'category': category,
                    'name': habit_data['name'],
                    'is_default': True,
                    'is_active': True,
                    'goal_days_per_week': 7,
                    'unit': habit_data['unit'],
                    'target_per_session': habit_data['target_per_session'],
                    'target_days': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    'dose_tablets': None,
                    'dose_per_tablet': None,
                    'dose_unit': None,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
                await db.habits.insert_one(habit)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'name': user_data.name,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Seed default data for new user
    await seed_default_data(user_id)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user['email'], name=user['name'], created_at=user['created_at'])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user['id'], email=user['email'], name=user['name'], created_at=user['created_at'])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        name=current_user['name'],
        created_at=current_user['created_at']
    )

# ============== TODO ROUTES ==============

@api_router.post("/todos", response_model=TodoResponse)
async def create_todo(todo_data: TodoCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    todo = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'title': todo_data.title,
        'notes': todo_data.notes,
        'tags': todo_data.tags,
        'urgency_tier': todo_data.urgency_tier,
        'urgency_date': todo_data.urgency_date,
        'importance_tier': todo_data.importance_tier,
        'importance_date': todo_data.importance_date,
        'status': 'not_started',
        'is_one_minute': todo_data.is_one_minute,
        'closed_at': None,
        'created_at': now,
        'updated_at': now
    }
    await db.todos.insert_one(todo)
    del todo['_id']
    return todo

@api_router.get("/todos", response_model=List[TodoResponse])
async def get_todos(
    status: Optional[str] = None,
    is_one_minute: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {'user_id': current_user['id']}
    if status:
        if status == 'open':
            query['status'] = {'$in': ['not_started', 'in_progress']}
        elif status == 'closed':
            query['status'] = 'closed'
        else:
            query['status'] = status
    if is_one_minute is not None:
        query['is_one_minute'] = is_one_minute
    
    todos = await db.todos.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return todos

@api_router.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: str, current_user: dict = Depends(get_current_user)):
    todo = await db.todos.find_one({'id': todo_id, 'user_id': current_user['id']}, {'_id': 0})
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@api_router.patch("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo_data: TodoUpdate, current_user: dict = Depends(get_current_user)):
    todo = await db.todos.find_one({'id': todo_id, 'user_id': current_user['id']})
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    update_data = {k: v for k, v in todo_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if 'status' in update_data and update_data['status'] == 'closed':
        update_data['closed_at'] = datetime.now(timezone.utc).isoformat()
    elif 'status' in update_data and update_data['status'] != 'closed':
        update_data['closed_at'] = None
    
    await db.todos.update_one({'id': todo_id}, {'$set': update_data})
    updated = await db.todos.find_one({'id': todo_id}, {'_id': 0})
    return updated

@api_router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.todos.delete_one({'id': todo_id, 'user_id': current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted"}

# ============== TAG ROUTES ==============

@api_router.get("/tags", response_model=List[TagResponse])
async def get_tags(current_user: dict = Depends(get_current_user)):
    tags = await db.tags.find({'user_id': current_user['id']}, {'_id': 0}).to_list(100)
    return tags

@api_router.post("/tags", response_model=TagResponse)
async def create_tag(tag_data: TagCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.tags.find_one({'user_id': current_user['id'], 'label': tag_data.label})
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")
    
    tag = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'label': tag_data.label,
        'is_default': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.tags.insert_one(tag)
    del tag['_id']
    return tag

@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    tag = await db.tags.find_one({'id': tag_id, 'user_id': current_user['id']})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.get('is_default'):
        raise HTTPException(status_code=400, detail="Cannot delete default tag")
    await db.tags.delete_one({'id': tag_id})
    return {"message": "Tag deleted"}

# ============== HABIT ROUTES ==============

@api_router.get("/habits", response_model=List[HabitResponse])
async def get_habits(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {'user_id': current_user['id']}
    if category:
        query['category'] = category
    habits = await db.habits.find(query, {'_id': 0}).to_list(200)
    return habits

@api_router.post("/habits", response_model=HabitResponse)
async def create_habit(habit_data: HabitCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    habit = {
        'id': str(uuid.uuid4()),
        'user_id': current_user['id'],
        'category': habit_data.category,
        'name': habit_data.name,
        'is_default': False,
        'is_active': True,
        'goal_days_per_week': habit_data.goal_days_per_week,
        'unit': habit_data.unit,
        'target_per_session': habit_data.target_per_session,
        'target_days': habit_data.target_days,
        'dose_tablets': habit_data.dose_tablets,
        'dose_per_tablet': habit_data.dose_per_tablet,
        'dose_unit': habit_data.dose_unit,
        'water_target': habit_data.water_target,
        'water_unit': habit_data.water_unit,
        'created_at': now,
        'updated_at': now
    }
    await db.habits.insert_one(habit)
    del habit['_id']
    return habit

@api_router.patch("/habits/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: str, habit_data: HabitUpdate, current_user: dict = Depends(get_current_user)):
    habit = await db.habits.find_one({'id': habit_id, 'user_id': current_user['id']})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    update_data = {k: v for k, v in habit_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.habits.update_one({'id': habit_id}, {'$set': update_data})
    updated = await db.habits.find_one({'id': habit_id}, {'_id': 0})
    return updated

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    habit = await db.habits.find_one({'id': habit_id, 'user_id': current_user['id']})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.habits.delete_one({'id': habit_id})
    await db.habit_logs.delete_many({'habit_id': habit_id})
    return {"message": "Habit deleted"}

# ============== HABIT LOG ROUTES ==============

@api_router.get("/habit-logs", response_model=List[HabitLogResponse])
async def get_habit_logs(
    habit_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {'user_id': current_user['id']}
    if habit_id:
        query['habit_id'] = habit_id
    if start_date:
        query['log_date'] = {'$gte': start_date}
    if end_date:
        if 'log_date' in query:
            query['log_date']['$lte'] = end_date
        else:
            query['log_date'] = {'$lte': end_date}
    
    logs = await db.habit_logs.find(query, {'_id': 0}).sort('log_date', -1).to_list(1000)
    return logs

@api_router.post("/habit-logs", response_model=HabitLogResponse)
async def create_habit_log(log_data: HabitLogCreate, current_user: dict = Depends(get_current_user)):
    # Check if habit exists and belongs to user
    habit = await db.habits.find_one({'id': log_data.habit_id, 'user_id': current_user['id']})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Check if log already exists for this date
    existing = await db.habit_logs.find_one({
        'habit_id': log_data.habit_id,
        'log_date': log_data.log_date
    })
    
    if existing:
        # Update existing log
        update_data = {
            'percent_achieved': log_data.percent_achieved,
            'is_done': log_data.is_done,
            'notes': log_data.notes
        }
        await db.habit_logs.update_one({'id': existing['id']}, {'$set': update_data})
        updated = await db.habit_logs.find_one({'id': existing['id']}, {'_id': 0})
        return updated
    
    log = {
        'id': str(uuid.uuid4()),
        'habit_id': log_data.habit_id,
        'user_id': current_user['id'],
        'log_date': log_data.log_date,
        'percent_achieved': log_data.percent_achieved,
        'is_done': log_data.is_done,
        'notes': log_data.notes,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.habit_logs.insert_one(log)
    del log['_id']
    return log

@api_router.delete("/habit-logs/{log_id}")
async def delete_habit_log(log_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.habit_logs.delete_one({'id': log_id, 'user_id': current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}

# ============== ANALYTICS ROUTES ==============

@api_router.get("/analytics/habits")
async def get_habit_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get all active habits
    habits = await db.habits.find({'user_id': current_user['id'], 'is_active': True}, {'_id': 0}).to_list(200)
    
    # Get logs for date range
    query = {'user_id': current_user['id']}
    if start_date:
        query['log_date'] = {'$gte': start_date}
    if end_date:
        if 'log_date' in query:
            query['log_date']['$lte'] = end_date
        else:
            query['log_date'] = {'$lte': end_date}
    
    logs = await db.habit_logs.find(query, {'_id': 0}).to_list(5000)
    
    # Group logs by habit
    logs_by_habit = {}
    for log in logs:
        habit_id = log['habit_id']
        if habit_id not in logs_by_habit:
            logs_by_habit[habit_id] = []
        logs_by_habit[habit_id].append(log)
    
    # Calculate analytics per habit
    analytics = []
    category_scores = {}
    
    for habit in habits:
        habit_logs = logs_by_habit.get(habit['id'], [])
        days_completed = len([l for l in habit_logs if l['is_done']])
        days_targeted = habit['goal_days_per_week']
        
        avg_percent = 0
        if habit_logs:
            avg_percent = sum(l['percent_achieved'] for l in habit_logs) / len(habit_logs)
        
        frequency_score = min((days_completed / max(days_targeted, 1)) * 100, 100) if days_targeted > 0 else 0
        volume_score = avg_percent
        overall_score = (frequency_score + volume_score) / 2
        
        analytics.append({
            'habit_id': habit['id'],
            'habit_name': habit['name'],
            'category': habit['category'],
            'days_completed': days_completed,
            'days_targeted': days_targeted,
            'frequency_score': round(frequency_score, 1),
            'volume_score': round(volume_score, 1),
            'overall_score': round(overall_score, 1),
            'logs': habit_logs
        })
        
        # Aggregate by category
        if habit['category'] not in category_scores:
            category_scores[habit['category']] = []
        category_scores[habit['category']].append(overall_score)
    
    # Calculate category averages
    category_analytics = {}
    for cat, scores in category_scores.items():
        category_analytics[cat] = round(sum(scores) / len(scores), 1) if scores else 0
    
    # Overall score
    all_scores = [a['overall_score'] for a in analytics]
    overall = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
    
    return {
        'habits': analytics,
        'categories': category_analytics,
        'overall_score': overall
    }

# ============== BASE ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "WindailyBud API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
