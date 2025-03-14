import asyncio

from loguru import logger
from sqlalchemy import select, delete

from app.game.data import tiles, cards
from app.database import db_helper
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


GROUP_COLOR_MAPPING = {
    "Brown": "#8B4513",
    "Light Blue": "#ADD8E6",
    "Pink": "#FFC0CB",
    "Orange": "#FFA500",
    "Red": "#FF0000",
    "Yellow": "#FFFF00",
    "Green": "#008000",
    "Dark Blue": "#00008B",
    "Railroad": "#808080",
    "Utility": "#D3D3D3",
}


async def load_game_data():
    await asyncio.gather(
        load_tiles(tiles),
        load_cards(cards),
    )


async def reload_game_data():
    await asyncio.gather(
        clean_game_data(),
        load_game_data(),
    )


async def clean_game_data():
    async with db_helper.get_scoped_session()() as session:
        await session.execute(delete(Special))
        await session.execute(delete(Company))
        await session.execute(delete(Railway))
        await session.execute(delete(Property))
        await session.execute(delete(Tile))
        await session.execute(delete(Group))

        await session.commit()


async def load_tiles(data: list[dict]):
    async with db_helper.get_scoped_session()() as session:
        result = await session.execute(select(Tile).limit(1))
        existing_tiles = result.scalars().all()
        if existing_tiles:
            logger.info("Tiles already loaded, skipping...")
            return

        # Cache groups that have already been inserted.
        groups_cache: dict[int, Group] = {}

        for tile_data in data:
            tile_index = tile_data["tile_position"]
            tile_name = tile_data["name"]

            if tile_data.get("property") is not None:
                tile_type = TileTypeEnum.property
            elif tile_data.get("railway") is not None:
                tile_type = TileTypeEnum.railway
            elif tile_data.get("utility") is not None:
                tile_type = TileTypeEnum.company
            elif tile_data.get("special_tile") is not None:
                tile_type = TileTypeEnum.special
            else:
                continue

            tile_record = Tile(index=tile_index, type=tile_type)
            session.add(tile_record)

            await session.flush()

            if tile_type == TileTypeEnum.property:
                prop_data = tile_data["property"]
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
                elif tile_name == "Casino":
                    special_type = SpecialTypeEnum.casino
                else:
                    special_type = SpecialTypeEnum.go

                special_record = Special(
                    tile_id=tile_record.id,
                    type=special_type,
                )
                session.add(special_record)
                tile_record.special = special_record

        await session.commit()


# TODO: Implement the load_cards function
async def load_cards(data: list[dict]):
    pass
