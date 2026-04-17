from app.services.ai_service import ClothingTags
from app.workers.tagging import tags_to_item_fields


def test_tags_to_item_fields_keeps_localized_tags_but_canonical_columns():
    tags = ClothingTags(
        type="shirt",
        subtype="oxford",
        primary_color="blue",
        colors=["blue", "white"],
        pattern="striped",
        material="cotton",
        style=["classic"],
        formality="casual",
        season=["spring"],
        fit="regular",
        description="蓝白条纹衬衫，版型合身。",
        localized_tags={
            "subtype": "牛津纺",
            "primary_color": "蓝色",
            "colors": ["蓝色", "白色"],
            "pattern": "条纹",
            "material": "棉",
            "style": ["经典"],
            "season": ["春季"],
            "formality": "休闲",
            "fit": "合身",
        },
    )

    fields = tags_to_item_fields(tags)

    assert fields["type"] == "shirt"
    assert fields["subtype"] == "oxford"
    assert fields["primary_color"] == "blue"
    assert fields["colors"] == ["blue", "white"]
    assert fields["pattern"] == "striped"
    assert fields["material"] == "cotton"
    assert fields["style"] == ["classic"]
    assert fields["formality"] == "casual"
    assert fields["season"] == ["spring"]
    assert fields["tags"]["subtype"] == "牛津纺"
    assert fields["tags"]["primary_color"] == "蓝色"
    assert fields["tags"]["colors"] == ["蓝色", "白色"]
    assert fields["tags"]["pattern"] == "条纹"
    assert fields["tags"]["material"] == "棉"
    assert fields["tags"]["style"] == ["经典"]
    assert fields["tags"]["season"] == ["春季"]
    assert fields["tags"]["formality"] == "休闲"
    assert fields["tags"]["fit"] == "合身"
    assert fields["ai_description"] == "蓝白条纹衬衫，版型合身。"
