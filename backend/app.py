import os
import io
import json
import base64
import math
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
from openai import OpenAI


# ============================================================
# CIVICLENS BACKEND
# ============================================================

load_dotenv()


# ------------------------------------------------------------
# Flask application
# ------------------------------------------------------------

app = Flask(__name__)

CORS(app)


# ------------------------------------------------------------
# DashScope / Qwen client
# ------------------------------------------------------------

api_key = os.getenv("DASHSCOPE_API_KEY")

if not api_key:
    raise RuntimeError(
        "DASHSCOPE_API_KEY is missing. "
        "Create a .env file inside backend/."
    )


client = OpenAI(
    api_key=api_key,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
)


# ============================================================
# CIVIC REPORT STORAGE
# ============================================================

# Prototype storage.
#
# Later we will replace this with Supabase/PostgreSQL.
#
# For now reports remain available while Flask is running.

civic_reports = []


# ============================================================
# LOCATION TOOL
# ============================================================

def get_location(latitude=None, longitude=None):
    """
    Get the user's location.

    The notebook currently uses test coordinates.
    The frontend will eventually send real browser GPS coordinates.
    """

    # If frontend provides coordinates, use them.
    if latitude is not None and longitude is not None:

        return {
            "success": True,
            "location": {
                "latitude": float(latitude),
                "longitude": float(longitude)
            },
            "message": "Location received from frontend."
        }

    # Notebook's current fallback/test coordinates.
    return {
        "success": True,
        "location": {
            "latitude": 34.0151,
            "longitude": 71.5249
        },
        "message": "Using CivicLens test location."
    }


# ============================================================
# DISTANCE CALCULATION
# ============================================================

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates
    using the Haversine formula.

    Returns distance in kilometers.
    """

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)

    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.asin(math.sqrt(a))

    earth_radius_km = 6371

    return earth_radius_km * c


# ============================================================
# FIND NEARBY REPORTS
# ============================================================

def find_nearby_reports(
    latitude,
    longitude,
    radius_km=1
):
    """
    Find previously reported civic problems
    within the specified radius.
    """

    nearby_reports = []

    for saved_report in civic_reports:

        if "location" not in saved_report:
            continue

        report_lat = saved_report["location"]["latitude"]
        report_lon = saved_report["location"]["longitude"]

        distance = calculate_distance(
            latitude,
            longitude,
            report_lat,
            report_lon
        )

        if distance <= radius_km:

            nearby_reports.append({
                "report_id": saved_report["report_id"],
                "problem": saved_report["problem"],
                "category": saved_report["category"],
                "severity": saved_report["severity"],
                "priority_score": saved_report["priority_score"],
                "distance_km": round(distance, 3),
                "status": saved_report["status"]
            })

    return {
        "success": True,
        "number_of_nearby_reports": len(nearby_reports),
        "reports": nearby_reports
    }


# ============================================================
# SAVE CIVIC REPORT
# ============================================================

def save_civic_report(
    problem,
    category,
    severity,
    priority_score,
    responsible_department,
    description,
    risk,
    recommended_action,
    latitude,
    longitude
):
    """
    Save a new CivicLens report.
    """

    new_report = {

        "report_id": len(civic_reports) + 1,

        "problem": problem,

        "category": category,

        "severity": severity,

        "priority_score": priority_score,

        "responsible_department": responsible_department,

        "description": description,

        "risk": risk,

        "recommended_action": recommended_action,

        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "status": "Pending",

        "created_at": datetime.now().isoformat()
    }

    civic_reports.append(new_report)

    return {
        "success": True,
        "report_id": new_report["report_id"],
        "message": "Civic report successfully saved."
    }


# ============================================================
# UPDATE CIVIC REPORT
# ============================================================

def update_civic_report(
    report_id,
    additional_information,
    new_severity=None,
    new_priority_score=None
):
    """
    Update an existing CivicLens report.
    """

    for saved_report in civic_reports:

        if saved_report["report_id"] == report_id:

            saved_report["additional_information"] = (
                additional_information
            )

            if new_severity is not None:
                saved_report["severity"] = new_severity

            if new_priority_score is not None:
                saved_report["priority_score"] = (
                    new_priority_score
                )

            return {
                "success": True,
                "report_id": report_id,
                "message": "Civic report successfully updated."
            }

    return {
        "success": False,
        "error": f"Report {report_id} not found."
    }


# ============================================================
# QWEN VISION
# ============================================================

def analyze_image_with_qwen(image_file):
    """
    Send an uploaded civic image to Qwen Vision.

    Based on the vision implementation in civic1.ipynb.
    """

    # --------------------------------------------------------
    # Open image
    # --------------------------------------------------------

    image = Image.open(image_file)

    # --------------------------------------------------------
    # Convert image to JPEG in memory
    # --------------------------------------------------------

    buffer = io.BytesIO()

    image.convert("RGB").save(
        buffer,
        format="JPEG"
    )

    # --------------------------------------------------------
    # Convert to Base64
    # --------------------------------------------------------

    image_base64 = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    image_data_url = (
        f"data:image/jpeg;base64,{image_base64}"
    )

    # --------------------------------------------------------
    # CivicLens Vision Prompt
    # --------------------------------------------------------

    vision_prompt = """
You are CivicLens, an AI assistant for identifying
and reporting civic problems.

Analyze this image carefully.

Identify:

1. What civic problem is visible?
2. Which civic category does it belong to?
3. How severe is the problem?
4. What priority score should it receive from 1 to 10?
5. Which department should handle it?
6. Give a detailed description.
7. What risks does the problem create?
8. What action should be taken?

Return ONLY valid JSON.

Use exactly this structure:

{
    "problem": "string",
    "category": "string",
    "severity": "Low|Medium|High|Critical",
    "priority_score": 1,
    "responsible_department": "string",
    "description": "string",
    "risk": "string",
    "recommended_action": "string"
}
"""

    # --------------------------------------------------------
    # Qwen Vision request
    # --------------------------------------------------------

    response = client.chat.completions.create(

        model="qwen-vl-max",

        messages=[
            {
                "role": "user",

                "content": [

                    {
                        "type": "text",
                        "text": vision_prompt
                    },

                    {
                        "type": "image_url",

                        "image_url": {
                            "url": image_data_url
                        }
                    }
                ]
            }
        ]
    )

    raw_result = response.choices[0].message.content

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        result = json.loads(raw_result)

    except json.JSONDecodeError:

        # Sometimes models return JSON inside ```json blocks.
        cleaned = raw_result.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]

        if cleaned.startswith("```"):
            cleaned = cleaned[3:]

        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        result = json.loads(cleaned.strip())

    return result


# ============================================================
# CIVICLENS AGENT
# ============================================================

def run_civiclens_agent(
    report,
    latitude,
    longitude
):
    """
    Run the CivicLens Qwen agent.

    Agent responsibilities:

    1. Check nearby reports.
    2. Detect possible duplicate.
    3. Update existing report when appropriate.
    4. Save a new report when no matching report exists.
    """

    # --------------------------------------------------------
    # Check nearby reports ourselves first.
    #
    # This guarantees the backend has the information
    # even if Qwen decides not to call the tool.
    # --------------------------------------------------------

    nearby_result = find_nearby_reports(
        latitude=latitude,
        longitude=longitude,
        radius_km=1
    )

    nearby_reports = nearby_result["reports"]

    # --------------------------------------------------------
    # Prepare tools for Qwen
    # --------------------------------------------------------

    civic_tools = [

        {
            "type": "function",

            "function": {

                "name": "find_nearby_reports",

                "description": """
Find previously reported civic problems near
a given latitude and longitude.

Use this before creating a new report to
check whether a similar problem already exists.
""",

                "parameters": {

                    "type": "object",

                    "properties": {

                        "latitude": {
                            "type": "number"
                        },

                        "longitude": {
                            "type": "number"
                        },

                        "radius_km": {
                            "type": "number"
                        }
                    },

                    "required": [
                        "latitude",
                        "longitude"
                    ]
                }
            }
        },

        {
            "type": "function",

            "function": {

                "name": "save_civic_report",

                "description": """
Save a new civic problem report.
Use this only when a matching report
does not already exist.
""",

                "parameters": {

                    "type": "object",

                    "properties": {

                        "problem": {
                            "type": "string"
                        },

                        "category": {
                            "type": "string"
                        },

                        "severity": {
                            "type": "string"
                        },

                        "priority_score": {
                            "type": "integer"
                        },

                        "responsible_department": {
                            "type": "string"
                        },

                        "description": {
                            "type": "string"
                        },

                        "risk": {
                            "type": "string"
                        },

                        "recommended_action": {
                            "type": "string"
                        },

                        "latitude": {
                            "type": "number"
                        },

                        "longitude": {
                            "type": "number"
                        }
                    },

                    "required": [
                        "problem",
                        "category",
                        "severity",
                        "priority_score",
                        "responsible_department",
                        "description",
                        "risk",
                        "recommended_action",
                        "latitude",
                        "longitude"
                    ]
                }
            }
        },

        {
            "type": "function",

            "function": {

                "name": "update_civic_report",

                "description": """
Update an existing civic report when
new information adds value.
""",

                "parameters": {

                    "type": "object",

                    "properties": {

                        "report_id": {
                            "type": "integer"
                        },

                        "additional_information": {
                            "type": "string"
                        },

                        "new_severity": {
                            "type": "string"
                        },

                        "new_priority_score": {
                            "type": "integer"
                        }
                    },

                    "required": [
                        "report_id",
                        "additional_information"
                    ]
                }
            }
        }
    ]

    # --------------------------------------------------------
    # Agent messages
    # --------------------------------------------------------

    messages = [

        {
            "role": "system",

            "content": """
You are CivicLens, an AI civic-reporting agent.

Your job is to process civic problems detected from images.

Follow this process:

1. Understand the civic problem.
2. Check nearby existing reports.
3. Determine whether a nearby report represents
   the same civic problem.
4. If a matching report already exists:
   - Do NOT create an unnecessary duplicate.
   - If the new information adds value,
     update the existing report.
5. If there is no matching report:
   - Save a new report.
6. Give a clear final response.

Important:

- Use real tool results.
- Do not invent report IDs.
- Do not claim a report was saved unless
  the save operation succeeds.
"""
        },

        {
            "role": "user",

            "content": f"""
Process this CivicLens report:

{json.dumps(report, indent=2)}

Current location:

Latitude: {latitude}
Longitude: {longitude}

Nearby reports already found by CivicLens:

{json.dumps(nearby_reports, indent=2)}

Determine whether this should create a new report
or update an existing report.
"""
        }
    ]

    # --------------------------------------------------------
    # Agent loop
    # --------------------------------------------------------

    max_iterations = 5

    action = None
    report_id = None

    for iteration in range(max_iterations):

        print(
            f"\n========== AGENT ITERATION "
            f"{iteration + 1} =========="
        )

        response = client.chat.completions.create(

            model="qwen-plus",

            messages=messages,

            tools=civic_tools,

            tool_choice="auto"
        )

        assistant_message = response.choices[0].message

        messages.append(assistant_message)

        # ----------------------------------------------------
        # Agent finished
        # ----------------------------------------------------

        if not assistant_message.tool_calls:

            return {
                "success": True,

                "action": action or "completed",

                "report_id": report_id,

                "final_response":
                    assistant_message.content,

                "nearby_reports":
                    nearby_reports
            }

        # ----------------------------------------------------
        # Execute requested tools
        # ----------------------------------------------------

        for tool_call in assistant_message.tool_calls:

            function_name = (
                tool_call.function.name
            )

            arguments = json.loads(
                tool_call.function.arguments
            )

            print(
                f"Qwen requested tool: "
                f"{function_name}"
            )

            print(
                json.dumps(
                    arguments,
                    indent=2
                )
            )

            # ------------------------------------------------
            # Find nearby reports
            # ------------------------------------------------

            if function_name == "find_nearby_reports":

                result = find_nearby_reports(
                    latitude=arguments["latitude"],
                    longitude=arguments["longitude"],
                    radius_km=arguments.get(
                        "radius_km",
                        1
                    )
                )

            # ------------------------------------------------
            # Save report
            # ------------------------------------------------

            elif function_name == "save_civic_report":

                result = save_civic_report(
                    **arguments
                )

                if result["success"]:

                    action = "created"

                    report_id = (
                        result["report_id"]
                    )

            # ------------------------------------------------
            # Update report
            # ------------------------------------------------

            elif function_name == "update_civic_report":

                result = update_civic_report(
                    **arguments
                )

                if result["success"]:

                    action = "updated"

                    report_id = (
                        result["report_id"]
                    )

            # ------------------------------------------------
            # Unknown tool
            # ------------------------------------------------

            else:

                result = {
                    "success": False,
                    "error":
                        f"Unknown tool: "
                        f"{function_name}"
                }

            print(
                "Tool result:",
                json.dumps(
                    result,
                    indent=2
                )
            )

            # ------------------------------------------------
            # Send result back to Qwen
            # ------------------------------------------------

            messages.append({

                "role": "tool",

                "tool_call_id":
                    tool_call.id,

                "content":
                    json.dumps(result)
            })

    # --------------------------------------------------------
    # Maximum iterations reached
    # --------------------------------------------------------

    return {

        "success": False,

        "action": action,

        "report_id": report_id,

        "final_response":
            "CivicLens agent reached "
            "the maximum number of steps.",

        "nearby_reports":
            nearby_reports
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/")
def home():

    return jsonify({

        "message":
            "CivicLens AI Backend is running!",

        "status":
            "online"
    })


@app.route("/health")
def health():

    return jsonify({

        "status":
            "healthy",

        "service":
            "CivicLens AI Backend"
    })


# ============================================================
# ANALYZE IMAGE API
# ============================================================

@app.route(
    "/analyze",
    methods=["POST"]
)
def analyze():

    try:

        # ----------------------------------------------------
        # Check image
        # ----------------------------------------------------

        if "image" not in request.files:

            return jsonify({

                "success": False,

                "error":
                    "No image uploaded."
            }), 400

        image = request.files["image"]

        if image.filename == "":

            return jsonify({

                "success": False,

                "error":
                    "No image selected."
            }), 400

        # ----------------------------------------------------
        # Get location from frontend
        # ----------------------------------------------------

        latitude = request.form.get(
            "latitude",
            type=float
        )

        longitude = request.form.get(
            "longitude",
            type=float
        )

        # ----------------------------------------------------
        # Use notebook fallback if GPS
        # isn't provided yet.
        # ----------------------------------------------------

        location_result = get_location(
            latitude=latitude,
            longitude=longitude
        )

        location = (
            location_result["location"]
        )

        latitude = location["latitude"]
        longitude = location["longitude"]

        print(
            f"Location: "
            f"{latitude}, {longitude}"
        )

        # ----------------------------------------------------
        # Qwen Vision
        # ----------------------------------------------------

        print(
            "\n========== QWEN VISION ==========\n"
        )

        report = analyze_image_with_qwen(
            image
        )

        print(
            json.dumps(
                report,
                indent=2
            )
        )

        # ----------------------------------------------------
        # Add location to report
        # ----------------------------------------------------

        report["location"] = {

            "latitude":
                latitude,

            "longitude":
                longitude
        }

        # ----------------------------------------------------
        # Run CivicLens Agent
        # ----------------------------------------------------

        print(
            "\n========== CIVICLENS AGENT ==========\n"
        )

        agent_result = run_civiclens_agent(

            report=report,

            latitude=latitude,

            longitude=longitude
        )

        # ----------------------------------------------------
        # Return everything to Next.js
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "analysis": report,

            "agent": agent_result,

            "location": location,

            "reports": civic_reports
        })

    except Exception as e:

        print(
            "\n========== ERROR ==========\n"
        )

        print(str(e))

        return jsonify({

            "success": False,

            "error": str(e)
        }), 500


# ============================================================
# GET ALL REPORTS
# ============================================================

@app.route(
    "/reports",
    methods=["GET"]
)
def get_reports():

    return jsonify({

        "success": True,

        "count":
            len(civic_reports),

        "reports":
            civic_reports
    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print(
        "\n========================================"
    )

    print(
        "       CIVICLENS AI BACKEND"
    )

    print(
        "========================================"
    )

    print(
        "Qwen Vision: qwen-vl-max"
    )

    print(
        "Qwen Agent:  qwen-plus"
    )

    print(
        "Server:      http://localhost:5000"
    )

    print(
        "========================================\n"
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )