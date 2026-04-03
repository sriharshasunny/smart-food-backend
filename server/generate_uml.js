const fs = require('fs');
const zlib = require('zlib');

function encode(puml) {
    const deflated = zlib.deflateSync(puml, { level: 9 });
    return deflated.toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_');
}

const sysArch = `@startuml
skinparam handwritten false
skinparam defaultFontName Arial
node "Client Browser" {
  [React UI]
  [State Context]
}
node "Node.js Server" {
  [Express API]
  [Auth Service]
  [Rec Pipeline]
}
database "Supabase" {
  [PostgreSQL]
}
cloud "External Services" {
  [Google Gemini AI]
  [Nodemailer]
}
[React UI] --> [Express API]
[Express API] --> [Auth Service]
[Express API] --> [Rec Pipeline]
[Auth Service] --> [PostgreSQL]
[Rec Pipeline] --> [PostgreSQL]
[Rec Pipeline] --> [Google Gemini AI]
[Auth Service] --> [Nodemailer]
@enduml`;

const classDiag = `@startuml
skinparam classAttributeIconSize 0
skinparam defaultFontName Arial

class User {
  - UUID id
  - String name
  - String email
  + register()
  + login()
}

class Restaurant {
  - UUID id
  - String name
  - Array cuisines
  + getMenu()
}

class FoodItem {
  - UUID id
  - String name
  - Float price
  - Boolean is_veg
}

class Order {
  - UUID id
  - Float total_amount
  - String status
  + checkout()
}

class OrderItem {
  - Integer quantity
  - Float price
}

User "1" -- "*" Order : places
Restaurant "1" -- "*" FoodItem : offers
Order "1" -- "*" OrderItem : contains
OrderItem "*" -- "1" FoodItem : references
@enduml`;

const useCaseDiag = `@startuml
left to right direction
skinparam defaultFontName Arial

actor "Customer" as cust
actor "Restaurant Part." as rest

rectangle "Smart Food Delivery System" {
  usecase "Login / Register" as UC1
  usecase "Browse AI Menu" as UC2
  usecase "Add items Cart" as UC3
  usecase "Checkout Payment" as UC4
  usecase "Manage Inventory" as UC5
}

cust --> UC1
cust --> UC2
cust --> UC3
cust --> UC4

rest --> UC1
rest --> UC5

UC4 .> UC1 : <<include>>
@enduml`;

const activityDiag = `@startuml
skinparam defaultFontName Arial

start
:Open Application;
:Login / Register;
:Browse Food Catalog;
:Add Items to Cart;
:Initiate Checkout;
if (Payment Complete?) then (Yes)
  :Save Order to DB;
  :Send Confirmation Email;
else (No)
  :Payment Error;
  stop
endif
stop
@enduml`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Academic UML Diagrams</title>
    <style>
        body { font-family: 'Times New Roman', serif; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { margin-top: 50px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .img-container { 
           border: 1px solid #000; 
           padding: 20px; 
           text-align: center; 
           margin-top: 15px; 
           background: white; 
        }
        img { max-width: 100%; height: auto; }
        .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <h1>Strict Academic UML Diagrams</h1>
    <p>These diagrams were generated using <b>PlantUML</b> to guarantee 100% textbook conformance to standard software engineering UML guidelines (proper stickmen, actor routing, layout mapping).</p>

    <!-- 1. Use Case Diagram -->
    <h2>1. Use Case Diagram</h2>
    <div class="img-container">
        <img src="https://kroki.io/plantuml/svg/${encode(useCaseDiag)}" alt="Use Case">
    </div>

    <!-- 2. Class Diagram -->
    <h2>2. Class Diagram</h2>
    <div class="img-container">
        <img src="https://kroki.io/plantuml/svg/${encode(classDiag)}" alt="Class Diagram">
    </div>

    <!-- 3. System Architecture -->
    <h2>3. System Architecture</h2>
    <div class="img-container">
        <img src="https://kroki.io/plantuml/svg/${encode(sysArch)}" alt="Architecture">
    </div>

    <!-- 4. Activity Diagram -->
    <h2>4. Activity Diagram</h2>
    <div class="img-container">
        <img src="https://kroki.io/plantuml/svg/${encode(activityDiag)}" alt="Activity">
    </div>

</body>
</html>`;

fs.writeFileSync('../dissertation_diagrams_academic_strict.html', html);
console.log('Successfully generated strict academic UML!');
