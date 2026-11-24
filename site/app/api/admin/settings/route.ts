import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { getNumericSetting, getSetting, setSetting } from "../../../../db/settings";
import { getShippingMode } from "../../../../lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  try {
    const shippingFlatFee = await getNumericSetting("shipping_flat_fee", 0);
    const shippingOriginId = await getNumericSetting("shipping_origin_id", 0);
    const shippingOriginLabel = await getSetting("shipping_origin_label", "");
    const shippingMode = await getShippingMode();
    const internationalStandardFee = await getNumericSetting("international_standard_fee", 0);
    const internationalExpressFee = await getNumericSetting("international_express_fee", 0);
    return Response.json(
      {
        shippingFlatFee,
        shippingMode,
        shippingOrigin: shippingOriginId > 0 ? { id: shippingOriginId, label: shippingOriginLabel } : null,
        internationalStandardFee,
        internationalExpressFee,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pengaturan gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: {
    shippingFlatFee?: number;
    shippingOriginId?: number;
    shippingOriginLabel?: string;
    shippingMode?: string;
    internationalStandardFee?: number;
    internationalExpressFee?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  try {
    if (body.shippingFlatFee !== undefined) {
      if (!Number.isInteger(body.shippingFlatFee) || body.shippingFlatFee < 0 || body.shippingFlatFee > 10000000) {
        return Response.json({ error: "Nominal ongkir tidak valid." }, { status: 400 });
      }
      await setSetting("shipping_flat_fee", String(body.shippingFlatFee));
    }

    if (body.shippingOriginId !== undefined) {
      const label = typeof body.shippingOriginLabel === "string" ? body.shippingOriginLabel.trim() : "";
      if (!Number.isInteger(body.shippingOriginId) || body.shippingOriginId <= 0 || !label) {
        return Response.json({ error: "Alamat asal tidak valid." }, { status: 400 });
      }
      await setSetting("shipping_origin_id", String(body.shippingOriginId));
      await setSetting("shipping_origin_label", label);
    }

    if (body.shippingMode !== undefined) {
      if (body.shippingMode !== "flat" && body.shippingMode !== "auto") {
        return Response.json({ error: "Mode ongkir tidak valid." }, { status: 400 });
      }
      await setSetting("shipping_mode", body.shippingMode);
    }

    if (body.internationalStandardFee !== undefined) {
      if (!Number.isInteger(body.internationalStandardFee) || body.internationalStandardFee < 0 || body.internationalStandardFee > 20000000) {
        return Response.json({ error: "Nominal ongkir internasional (Standard) tidak valid." }, { status: 400 });
      }
      await setSetting("international_standard_fee", String(body.internationalStandardFee));
    }

    if (body.internationalExpressFee !== undefined) {
      if (!Number.isInteger(body.internationalExpressFee) || body.internationalExpressFee < 0 || body.internationalExpressFee > 20000000) {
        return Response.json({ error: "Nominal ongkir internasional (Express) tidak valid." }, { status: 400 });
      }
      await setSetting("international_express_fee", String(body.internationalExpressFee));
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pengaturan gagal disimpan." }, { status: 503 });
  }
}
