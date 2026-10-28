import re

import pytest

from app.agent.prompts import build_system_prompt
from app.domain.apply import apply_ops
from app.domain.catalog import load_catalog
from app.domain.errors import DomainError
from app.export.strings import CATALOG_NAMES
from tests.domain.conftest import load_design

NEW_COLOURS = {"navy_blue": "#2b3a52", "sage_green": "#8f9e83", "sand_beige": "#d9c8ad", "terracotta": "#b5603f"}
NEW_MATERIAL = "birch_plywood"


def all_ids(catalog: dict) -> list[str]:
    return [entry["id"] for section in ("materials", "colors", "finishes") for entry in catalog[section]]


def test_catalog_ids_are_unique_and_hex_values_are_valid():
    catalog = load_catalog()
    ids = all_ids(catalog)
    assert len(ids) == len(set(ids))
    assert all(re.fullmatch(r"#[0-9a-f]{6}", color["hex"]) for color in catalog["colors"])


def test_new_entries_are_in_the_catalog():
    catalog = load_catalog()
    colours = {color["id"]: color["hex"] for color in catalog["colors"]}
    for color_id, hex_value in NEW_COLOURS.items():
        assert colours[color_id] == hex_value
    assert NEW_MATERIAL in {material["id"] for material in catalog["materials"]}


def test_every_catalog_id_has_a_hebrew_name_for_the_pdf():
    """Drift guard: adding a catalog entry must also add its Hebrew PDF name."""
    for catalog_id in all_ids(load_catalog()):
        assert CATALOG_NAMES["he"].get(catalog_id), f"missing Hebrew name for {catalog_id}"


def test_set_material_accepts_each_new_entry_and_rejects_unknown_ids():
    catalog = load_catalog()
    for color_id in NEW_COLOURS:
        result = apply_ops(load_design("basic"), [{"op": "set_material", "target": "carcass", "color": {"catalogId": color_id}}], catalog)
        assert result["carcass"]["appearance"]["color"] == {"catalogId": color_id}
    result = apply_ops(load_design("basic"), [{"op": "set_material", "target": "doors", "material": {"catalogId": NEW_MATERIAL}}], catalog)
    assert result["doors"]["appearance"]["material"] == {"catalogId": NEW_MATERIAL}
    with pytest.raises(DomainError):
        apply_ops(load_design("basic"), [{"op": "set_material", "target": "carcass", "color": {"catalogId": "pink"}}], catalog)


def test_agent_prompt_lists_the_new_entries():
    catalog = load_catalog()
    prompt = build_system_prompt(apply_ops(load_design("basic"), [], catalog), catalog, "en")
    for catalog_id in [*NEW_COLOURS, NEW_MATERIAL]:
        assert catalog_id in prompt
