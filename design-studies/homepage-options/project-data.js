export const project = {
  "title": "Community donation drive",
  "tasks": [
    {
      "id": "intake",
      "name": "Welcome & collect",
      "dependencies": [],
      "time": "09:00–10:00",
      "roles": "1 intake host",
      "supplies": "No supplies required",
      "people": [
        "Jamie Flores"
      ]
    },
    {
      "id": "sorting",
      "name": "Sort useful donations",
      "dependencies": [
        "intake"
      ],
      "time": "10:00–11:30",
      "roles": "2 sorting volunteers",
      "supplies": "20 donation boxes",
      "people": [
        "Jamie Flores",
        "Morgan Ellis"
      ]
    },
    {
      "id": "delivery",
      "name": "Deliver to the community hub",
      "dependencies": [
        "sorting"
      ],
      "time": "11:30–12:30",
      "roles": "1 qualified driver",
      "supplies": "1 delivery van",
      "people": [
        "Taylor Reed"
      ]
    }
  ],
  "coverage": "4 of 4 roles covered",
  "verified": true
};
