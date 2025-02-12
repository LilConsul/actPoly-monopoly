import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import (
    Tile,
    Property,
    Railway,
    Company,
    Special,
    Group,
    TileTypeEnum,
    SpecialTypeEnum,
)

# A simple mapping from group (property color) names to a color code.
GROUP_COLOR_MAPPING = {
    "Brown": "#8B4513",
    "Light Blue": "#ADD8E6",
    "Pink": "#FFC0CB",
    "Orange": "#FFA500",
    "Red": "#FF0000",
    "Yellow": "#FFFF00",
    "Green": "#008000",
    "Dark Blue": "#00008B",
    # For railroads and utilities these colors are not used in a Property,
    # but if needed you can extend the mapping.
    "Railroad": "#808080",
    "Utility": "#D3D3D3",
}


async def load_tiles(session: AsyncSession, data: list[dict]):
    # Cache groups that have already been inserted.
    groups_cache: dict[int, Group] = {}

    for tile_data in data:
        tile_index = tile_data["tile_position"]
        tile_name = tile_data["name"]

        # Decide which kind of tile this is.
        if tile_data.get("property") is not None:
            tile_type = TileTypeEnum.property
        elif tile_data.get("railway") is not None:
            tile_type = TileTypeEnum.railway
        elif tile_data.get("utility") is not None:
            tile_type = TileTypeEnum.company
        elif tile_data.get("special_tile") is not None:
            tile_type = TileTypeEnum.special
        else:
            # If nothing matches, skip this tile.
            continue

        # Create the Tile record.
        tile_record = Tile(index=tile_index, type=tile_type)
        session.add(tile_record)
        # Flush so that tile_record gets its id (needed for FK relationships).
        await session.flush()

        if tile_type == TileTypeEnum.property:
            prop_data = tile_data["property"]
            # Look up (or create) the Group record using the provided group info.
            group_info = tile_data.get("group")
            group = None
            if group_info:
                group_json_id = group_info["id"]
                if group_json_id in groups_cache:
                    group = groups_cache[group_json_id]
                else:
                    group_name = group_info["name"]
                    color = GROUP_COLOR_MAPPING.get(group_name, "#000000")
                    group = Group(name=group_name, color=color, property_count=0)
                    session.add(group)
                    await session.flush()
                    groups_cache[group_json_id] = group
                # Increase the property count.
                group.property_count += 1

            # For properties we map:
            # • JSON "base_rent" → rent_0_house,
            # • "one_house_rent" → rent_1_house,
            # • "two_houses_rent" → rent_2_house, etc.
            # For mortgage we use a simple default (half the price).
            # For hotel_price we use house_price as a placeholder.
            house_price = prop_data["house_price"]
            price = prop_data["price"]
            property_record = Property(
                tile_id=tile_record.id,
                group_id=group.id if group else None,
                name=tile_name,
                description="",
                price=price,
                mortgage=price / 2,
                house_price=house_price,
                hotel_price=house_price,  # placeholder value
                rent_0_house=prop_data["base_rent"],
                rent_1_house=prop_data["one_house_rent"],
                rent_2_house=prop_data["two_houses_rent"],
                rent_3_house=prop_data["three_houses_rent"],
                rent_4_house=prop_data["four_houses_rent"],
                rent_hotel=prop_data["hotel_rent"],
            )
            session.add(property_record)
            tile_record.property = property_record

        elif tile_type == TileTypeEnum.railway:
            rail_data = tile_data["railway"]
            price = rail_data["price"]
            railway_record = Railway(
                tile_id=tile_record.id,
                name=tile_name,
                description="",
                price=price,
                mortgage=price / 2,
                rent_1=rail_data["one_owned_rent"],
                rent_2=rail_data["two_owned_rent"],
                rent_3=rail_data["three_owned_rent"],
                rent_4=rail_data["four_owned_rent"],
            )
            session.add(railway_record)
            tile_record.railway = railway_record

        elif tile_type == TileTypeEnum.company:
            # Here we treat a utility tile as a "company" tile.
            util_data = tile_data["utility"]
            price = util_data["price"]
            # Map the multipliers into the two rent fields.
            company_record = Company(
                tile_id=tile_record.id,
                name=tile_name,
                description="",
                price=price,
                mortgage=price / 2,
                rent_1=util_data["one_company_owned_multiplier"],
                rent_2=util_data["two_companies_owned_multiplier"],
            )
            session.add(company_record)
            tile_record.company = company_record

        elif tile_type == TileTypeEnum.special:
            special_info = tile_data["special_tile"]

            # Decide on the special tile’s type.
            # (You might want to improve this mapping based on your game logic.)
            if tile_name == "Go":
                special_type = SpecialTypeEnum.go
            elif tile_name == "Jail/Just Visiting":
                special_type = SpecialTypeEnum.jail
            elif tile_name == "Go To Jail":
                special_type = SpecialTypeEnum.goto_jail
            elif tile_name in ("Income Tax", "Luxury Tax"):
                special_type = SpecialTypeEnum.tax
            elif "Community Chest" in tile_name:
                special_type = SpecialTypeEnum.chest
            elif "Chance" in tile_name:
                special_type = SpecialTypeEnum.chance
            elif tile_name == "Free Parking":
                # There isn’t a perfect match in your enum for Free Parking;
                # here we choose “casino” as a placeholder.
                special_type = SpecialTypeEnum.casino
            else:
                # Default fallback
                special_type = SpecialTypeEnum.go

            special_record = Special(
                tile_id=tile_record.id,
                type=special_type,
            )
            session.add(special_record)
            tile_record.special = special_record

    await session.commit()

tile_data = [
    {
        "name": "Electric Company",
        "tile_position": 12,
        "id": 12,
        "group_id": 11,
        "group": {"id": 11, "name": "Utility"},
        "railway": None,
        "utility": {
            "one_company_owned_multiplier": 4,
            "tile_id": 12,
            "id": 1,
            "price": 150,
            "two_companies_owned_multiplier": 10,
        },
        "property": None,
        "special_tile": None,
    },
    {
        "name": "Water Works",
        "tile_position": 28,
        "id": 28,
        "group_id": 11,
        "group": {"id": 11, "name": "Utility"},
        "railway": None,
        "utility": {
            "one_company_owned_multiplier": 4,
            "tile_id": 28,
            "id": 2,
            "price": 150,
            "two_companies_owned_multiplier": 10,
        },
        "property": None,
        "special_tile": None,
    },
    {
        "name": "B. & O. Railroad",
        "tile_position": 25,
        "id": 25,
        "group_id": 10,
        "group": {"id": 10, "name": "Railroad"},
        "railway": {
            "one_owned_rent": 25,
            "three_owned_rent": 100,
            "id": 3,
            "tile_id": 25,
            "price": 200,
            "two_owned_rent": 50,
            "four_owned_rent": 200,
        },
        "utility": None,
        "property": None,
        "special_tile": None,
    },
    {
        "name": "Atlantic Avenue",
        "tile_position": 26,
        "id": 26,
        "group_id": 7,
        "group": {"id": 7, "name": "Yellow"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 26,
            "one_house_rent": 110,
            "three_houses_rent": 800,
            "hotel_rent": 1150,
            "base_rent": 22,
            "price": 260,
            "two_houses_rent": 330,
            "four_houses_rent": 975,
            "id": 15,
        },
        "special_tile": None,
    },
    {
        "name": "Community Chest",
        "tile_position": 17,
        "id": 17,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 2,
            "description": "Draw a Community Chest card.",
            "tile_id": 17,
            "id": 6,
            "action": {
                "id": 2,
                "description": "Draw a Community Chest card",
                "name": "Community Chest",
            },
        },
    },
    {
        "name": "Community Chest",
        "tile_position": 33,
        "id": 33,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 2,
            "description": "Draw a Community Chest card.",
            "tile_id": 33,
            "id": 10,
            "action": {
                "id": 2,
                "description": "Draw a Community Chest card",
                "name": "Community Chest",
            },
        },
    },
    {
        "name": "Go",
        "tile_position": 0,
        "id": 0,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Collect $200 salary as you pass.",
            "tile_id": 0,
            "id": 1,
            "action": None,
        },
    },
    {
        "name": "Jail/Just Visiting",
        "tile_position": 10,
        "id": 10,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Just Visiting / In Jail.",
            "tile_id": 10,
            "id": 5,
            "action": None,
        },
    },
    {
        "name": "Pennsylvania Railroad",
        "tile_position": 15,
        "id": 15,
        "group_id": 10,
        "group": {"id": 10, "name": "Railroad"},
        "railway": {
            "one_owned_rent": 25,
            "three_owned_rent": 100,
            "id": 2,
            "tile_id": 15,
            "price": 200,
            "two_owned_rent": 50,
            "four_owned_rent": 200,
        },
        "utility": None,
        "property": None,
        "special_tile": None,
    },
    {
        "name": "Kentucky Avenue",
        "tile_position": 21,
        "id": 21,
        "group_id": 6,
        "group": {"id": 6, "name": "Red"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 21,
            "one_house_rent": 90,
            "three_houses_rent": 700,
            "hotel_rent": 1050,
            "base_rent": 18,
            "price": 220,
            "two_houses_rent": 250,
            "four_houses_rent": 875,
            "id": 12,
        },
        "special_tile": None,
    },
    {
        "name": "North Carolina Avenue",
        "tile_position": 32,
        "id": 32,
        "group_id": 8,
        "group": {"id": 8, "name": "Green"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 200,
            "tile_id": 32,
            "one_house_rent": 130,
            "three_houses_rent": 900,
            "hotel_rent": 1275,
            "base_rent": 26,
            "price": 300,
            "two_houses_rent": 390,
            "four_houses_rent": 1100,
            "id": 19,
        },
        "special_tile": None,
    },
    {
        "name": "Illinois Avenue",
        "tile_position": 24,
        "id": 24,
        "group_id": 6,
        "group": {"id": 6, "name": "Red"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 24,
            "one_house_rent": 100,
            "three_houses_rent": 750,
            "hotel_rent": 1100,
            "base_rent": 20,
            "price": 240,
            "two_houses_rent": 300,
            "four_houses_rent": 925,
            "id": 14,
        },
        "special_tile": None,
    },
    {
        "name": "Vermont Avenue",
        "tile_position": 8,
        "id": 8,
        "group_id": 3,
        "group": {"id": 3, "name": "Light Blue"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 50,
            "tile_id": 8,
            "one_house_rent": 30,
            "three_houses_rent": 270,
            "hotel_rent": 550,
            "base_rent": 6,
            "price": 100,
            "two_houses_rent": 90,
            "four_houses_rent": 400,
            "id": 4,
        },
        "special_tile": None,
    },
    {
        "name": "Go To Jail",
        "tile_position": 30,
        "id": 30,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Go directly to Jail.",
            "tile_id": 30,
            "id": 9,
            "action": None,
        },
    },
    {
        "name": "Oriental Avenue",
        "tile_position": 6,
        "id": 6,
        "group_id": 3,
        "group": {"id": 3, "name": "Light Blue"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 50,
            "tile_id": 6,
            "one_house_rent": 30,
            "three_houses_rent": 270,
            "hotel_rent": 550,
            "base_rent": 6,
            "price": 100,
            "two_houses_rent": 90,
            "four_houses_rent": 400,
            "id": 3,
        },
        "special_tile": None,
    },
    {
        "name": "Marvin Gardens",
        "tile_position": 29,
        "id": 29,
        "group_id": 7,
        "group": {"id": 7, "name": "Yellow"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 29,
            "one_house_rent": 120,
            "three_houses_rent": 850,
            "hotel_rent": 1200,
            "base_rent": 24,
            "price": 280,
            "two_houses_rent": 360,
            "four_houses_rent": 1025,
            "id": 17,
        },
        "special_tile": None,
    },
    {
        "name": "Chance",
        "tile_position": 36,
        "id": 36,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 1,
            "description": "Draw a Chance card.",
            "tile_id": 36,
            "id": 11,
            "action": {
                "id": 1,
                "description": "Draw a Chance card",
                "name": "Chance",
            },
        },
    },
    {
        "name": "Indiana Avenue",
        "tile_position": 23,
        "id": 23,
        "group_id": 6,
        "group": {"id": 6, "name": "Red"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 23,
            "one_house_rent": 90,
            "three_houses_rent": 700,
            "hotel_rent": 1050,
            "base_rent": 18,
            "price": 220,
            "two_houses_rent": 250,
            "four_houses_rent": 875,
            "id": 13,
        },
        "special_tile": None,
    },
    {
        "name": "Short Line Railroad",
        "tile_position": 35,
        "id": 35,
        "group_id": 10,
        "group": {"id": 10, "name": "Railroad"},
        "railway": {
            "one_owned_rent": 25,
            "three_owned_rent": 100,
            "id": 4,
            "tile_id": 35,
            "price": 200,
            "two_owned_rent": 50,
            "four_owned_rent": 200,
        },
        "utility": None,
        "property": None,
        "special_tile": None,
    },
    {
        "name": "Chance",
        "tile_position": 7,
        "id": 7,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 1,
            "description": "Draw a Chance card.",
            "tile_id": 7,
            "id": 4,
            "action": {
                "id": 1,
                "description": "Draw a Chance card",
                "name": "Chance",
            },
        },
    },
    {
        "name": "Free Parking",
        "tile_position": 20,
        "id": 20,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Free Parking.",
            "tile_id": 20,
            "id": 7,
            "action": None,
        },
    },
    {
        "name": "Ventnor Avenue",
        "tile_position": 27,
        "id": 27,
        "group_id": 7,
        "group": {"id": 7, "name": "Yellow"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 150,
            "tile_id": 27,
            "one_house_rent": 110,
            "three_houses_rent": 800,
            "hotel_rent": 1150,
            "base_rent": 22,
            "price": 260,
            "two_houses_rent": 330,
            "four_houses_rent": 975,
            "id": 16,
        },
        "special_tile": None,
    },
    {
        "name": "St. Charles Place",
        "tile_position": 11,
        "id": 11,
        "group_id": 4,
        "group": {"id": 4, "name": "Pink"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 11,
            "one_house_rent": 50,
            "three_houses_rent": 450,
            "hotel_rent": 750,
            "base_rent": 10,
            "price": 140,
            "two_houses_rent": 150,
            "four_houses_rent": 625,
            "id": 6,
        },
        "special_tile": None,
    },
    {
        "name": "Boardwalk",
        "tile_position": 39,
        "id": 39,
        "group_id": 9,
        "group": {"id": 9, "name": "Dark Blue"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 200,
            "tile_id": 39,
            "one_house_rent": 200,
            "three_houses_rent": 1400,
            "hotel_rent": 2000,
            "base_rent": 50,
            "price": 400,
            "two_houses_rent": 600,
            "four_houses_rent": 1700,
            "id": 22,
        },
        "special_tile": None,
    },
    {
        "name": "Pacific Avenue",
        "tile_position": 31,
        "id": 31,
        "group_id": 8,
        "group": {"id": 8, "name": "Green"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 200,
            "tile_id": 31,
            "one_house_rent": 130,
            "three_houses_rent": 900,
            "hotel_rent": 1275,
            "base_rent": 26,
            "price": 300,
            "two_houses_rent": 390,
            "four_houses_rent": 1100,
            "id": 18,
        },
        "special_tile": None,
    },
    {
        "name": "Pennsylvania Avenue",
        "tile_position": 34,
        "id": 34,
        "group_id": 8,
        "group": {"id": 8, "name": "Green"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 200,
            "tile_id": 34,
            "one_house_rent": 150,
            "three_houses_rent": 1000,
            "hotel_rent": 1400,
            "base_rent": 28,
            "price": 320,
            "two_houses_rent": 450,
            "four_houses_rent": 1200,
            "id": 20,
        },
        "special_tile": None,
    },
    {
        "name": "Tennessee Avenue",
        "tile_position": 18,
        "id": 18,
        "group_id": 5,
        "group": {"id": 5, "name": "Orange"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 18,
            "one_house_rent": 70,
            "three_houses_rent": 550,
            "hotel_rent": 950,
            "base_rent": 14,
            "price": 180,
            "two_houses_rent": 200,
            "four_houses_rent": 750,
            "id": 10,
        },
        "special_tile": None,
    },
    {
        "name": "Community Chest",
        "tile_position": 2,
        "id": 2,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 2,
            "description": "Draw a Community Chest card.",
            "tile_id": 2,
            "id": 2,
            "action": {
                "id": 2,
                "description": "Draw a Community Chest card",
                "name": "Community Chest",
            },
        },
    },
    {
        "name": "States Avenue",
        "tile_position": 13,
        "id": 13,
        "group_id": 4,
        "group": {"id": 4, "name": "Pink"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 13,
            "one_house_rent": 50,
            "three_houses_rent": 450,
            "hotel_rent": 750,
            "base_rent": 10,
            "price": 140,
            "two_houses_rent": 150,
            "four_houses_rent": 625,
            "id": 7,
        },
        "special_tile": None,
    },
    {
        "name": "Reading Railroad",
        "tile_position": 5,
        "id": 5,
        "group_id": 10,
        "group": {"id": 10, "name": "Railroad"},
        "railway": {
            "one_owned_rent": 25,
            "three_owned_rent": 100,
            "id": 1,
            "tile_id": 5,
            "price": 200,
            "two_owned_rent": 50,
            "four_owned_rent": 200,
        },
        "utility": None,
        "property": None,
        "special_tile": None,
    },
    {
        "name": "New York Avenue",
        "tile_position": 19,
        "id": 19,
        "group_id": 5,
        "group": {"id": 5, "name": "Orange"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 19,
            "one_house_rent": 80,
            "three_houses_rent": 600,
            "hotel_rent": 1000,
            "base_rent": 16,
            "price": 200,
            "two_houses_rent": 220,
            "four_houses_rent": 800,
            "id": 11,
        },
        "special_tile": None,
    },
    {
        "name": "Park Place",
        "tile_position": 37,
        "id": 37,
        "group_id": 9,
        "group": {"id": 9, "name": "Dark Blue"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 200,
            "tile_id": 37,
            "one_house_rent": 175,
            "three_houses_rent": 1100,
            "hotel_rent": 1500,
            "base_rent": 35,
            "price": 350,
            "two_houses_rent": 500,
            "four_houses_rent": 1300,
            "id": 21,
        },
        "special_tile": None,
    },
    {
        "name": "Luxury Tax",
        "tile_position": 38,
        "id": 38,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Pay Luxury Tax of $100.",
            "tile_id": 38,
            "id": 12,
            "action": None,
        },
    },
    {
        "name": "St. James Place",
        "tile_position": 16,
        "id": 16,
        "group_id": 5,
        "group": {"id": 5, "name": "Orange"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 16,
            "one_house_rent": 70,
            "three_houses_rent": 550,
            "hotel_rent": 950,
            "base_rent": 14,
            "price": 180,
            "two_houses_rent": 200,
            "four_houses_rent": 750,
            "id": 9,
        },
        "special_tile": None,
    },
    {
        "name": "Income Tax",
        "tile_position": 4,
        "id": 4,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": None,
            "description": "Pay Income Tax of $200.",
            "tile_id": 4,
            "id": 3,
            "action": None,
        },
    },
    {
        "name": "Mediterranean Avenue",
        "tile_position": 1,
        "id": 1,
        "group_id": 2,
        "group": {"id": 2, "name": "Brown"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 50,
            "tile_id": 1,
            "one_house_rent": 10,
            "three_houses_rent": 90,
            "hotel_rent": 250,
            "base_rent": 2,
            "price": 60,
            "two_houses_rent": 30,
            "four_houses_rent": 160,
            "id": 1,
        },
        "special_tile": None,
    },
    {
        "name": "Chance",
        "tile_position": 22,
        "id": 22,
        "group_id": 1,
        "group": {"id": 1, "name": "Special"},
        "railway": None,
        "utility": None,
        "property": None,
        "special_tile": {
            "action_id": 1,
            "description": "Draw a Chance card.",
            "tile_id": 22,
            "id": 8,
            "action": {
                "id": 1,
                "description": "Draw a Chance card",
                "name": "Chance",
            },
        },
    },
    {
        "name": "Baltic Avenue",
        "tile_position": 3,
        "id": 3,
        "group_id": 2,
        "group": {"id": 2, "name": "Brown"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 50,
            "tile_id": 3,
            "one_house_rent": 20,
            "three_houses_rent": 180,
            "hotel_rent": 450,
            "base_rent": 4,
            "price": 60,
            "two_houses_rent": 60,
            "four_houses_rent": 320,
            "id": 2,
        },
        "special_tile": None,
    },
    {
        "name": "Virginia Avenue",
        "tile_position": 14,
        "id": 14,
        "group_id": 4,
        "group": {"id": 4, "name": "Pink"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 100,
            "tile_id": 14,
            "one_house_rent": 60,
            "three_houses_rent": 500,
            "hotel_rent": 900,
            "base_rent": 12,
            "price": 160,
            "two_houses_rent": 180,
            "four_houses_rent": 700,
            "id": 8,
        },
        "special_tile": None,
    },
    {
        "name": "Connecticut Avenue",
        "tile_position": 9,
        "id": 9,
        "group_id": 3,
        "group": {"id": 3, "name": "Light Blue"},
        "railway": None,
        "utility": None,
        "property": {
            "house_price": 50,
            "tile_id": 9,
            "one_house_rent": 40,
            "three_houses_rent": 300,
            "hotel_rent": 600,
            "base_rent": 8,
            "price": 120,
            "two_houses_rent": 100,
            "four_houses_rent": 450,
            "id": 5,
        },
        "special_tile": None,
    },
]

