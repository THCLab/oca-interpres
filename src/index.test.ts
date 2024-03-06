import axios from "axios"
import { describe, expect, test } from "vitest"
import { from } from "./index.js"

describe("#from", () => {
  test("creates intermediary object graph", async () => {
    const bundleSAID = await setupBundle()

    const bundle = await axios.get(
      `https://repository.oca.argo.colossi.network/api/oca-bundles/${bundleSAID}?w=true`,
    )
    const pres = setupPres(bundleSAID)
    const result = await from(bundle.data, pres.presentation, {})
    console.dir(result, { depth: null })
  })
})

const setupBundle = async (): Promise<string> => {
  const ocafile = `ADD ATTRIBUTE d=Text i=Text passed=Boolean nice_attr=Text
ADD META en PROPS name="Entrance credential" description="Entrance credential"
ADD META pl PROPS name="Kredenszjal wejściowy" description="Kredenszjal wejściowy"
ADD CHARACTER_ENCODING ATTRS d=utf-8 i=utf-8 passed=utf-8 nice_attr=utf-8
ADD CONFORMANCE ATTRS d=M i=M passed=M nice_attr=O
ADD ATTRIBUTE select=Text
ADD ENTRY_CODE ATTRS select=["o1", "o2", "o3"]
ADD ENTRY en ATTRS select={"o1": "o1_label", "o2": "o2_label", "o3": "o3_label"}
ADD ENTRY pl ATTRS select={"o1": "o1_etykieta", "o2": "o2_etykieta", "o3": "o3_etykieta"}
ADD ATTRIBUTE selectmulti=Array[Text]
ADD ENTRY_CODE ATTRS selectmulti=["o4", "o5", "o6", "o7"]
ADD ENTRY en ATTRS selectmulti={"o4": "Four", "o5": "Five", "o6": "Six", "o7": "Seven"}
ADD ENTRY pl ATTRS selectmulti={"o4": "Cztery", "o5": "Pięc", "o6": "Sześć", "o7": "Siedem"}
ADD CONFORMANCE ATTRS selectmulti=M select=M
ADD INFORMATION en ATTRS \
	d="Schema digest" \
	i="Credential Issuee" \
	passed="Enables or disables passing"\
	select="Select option"\
	selectmulti="choose multi option"\
	nice_attr="nice placeholder"
ADD LABEL en ATTRS\
	d="Schema digest"\
	i="Credential Issuee"\
	passed="Passed"\
	select="Select option lbl"\
	selectmulti="Multiselect"\
	nice_attr="Nice attribute"
ADD LABEL pl ATTRS\
	d="trawić schemat"\
	i="Kredenszjal wystawiacz"\
	passed="Zaliczony"\
	select="Wybierz opcję"\
	selectmulti="Multiselekt"\
	nice_attr="Ładny atrybut"
ADD FORMAT ATTRS i="^issuer[0-9]+$"
ADD ATTRIBUTE img=Binary
ADD LABEL en ATTRS img="Image"
ADD LABEL pl ATTRS img="Obrazek"
ADD ATTRIBUTE sign=Binary
ADD LABEL en ATTRS sign="Signature"
ADD LABEL pl ATTRS sign="Podpis"
ADD ATTRIBUTE num=Numeric date=DateTime
ADD FORMAT ATTRS date="DD.MM.YYYY"
ADD LABEL en ATTRS num="Number" date="Date"
ADD ATTRIBUTE time=DateTime
ADD FORMAT ATTRS time="hh:mm A"
ADD LABEL en ATTRS time="Time"
ADD ATTRIBUTE list_text=Array[Text]
ADD CARDINALITY ATTRS list_text="1-"
ADD LABEL en ATTRS list_text="Text list1"
ADD ATTRIBUTE list_text2=Array[Text]
ADD CARDINALITY ATTRS list_text2="2-"
ADD LABEL en ATTRS list_text2="Text list2"
ADD ATTRIBUTE list_text3=Array[Text]
ADD CARDINALITY ATTRS list_text3="2"
ADD LABEL en ATTRS list_text3="Text list3"
ADD ATTRIBUTE list_num=Array[Numeric]
ADD LABEL en ATTRS list_num="List (numeric)"
ADD ATTRIBUTE list_bool=Array[Boolean]
ADD LABEL en ATTRS list_bool="List (bool)"
ADD ATTRIBUTE list_date=Array[DateTime]
ADD FORMAT ATTRS list_date="DD/MM/YYYY (HH:mm:ss)"
ADD LABEL en ATTRS list_date="List (date)"
ADD ATTRIBUTE list_file=Array[Binary]
ADD LABEL en ATTRS list_file="List (file)"
ADD ATTRIBUTE list_sign=Array[Binary]
ADD LABEL en ATTRS list_sign="List (sign)"
ADD ATTRIBUTE radio1=Text
ADD LABEL en ATTRS radio1="Radio btn vertical"
ADD LABEL pl ATTRS radio1="Radio guzik pionowy"
ADD ENTRY_CODE ATTRS radio1=["o1", "o2", "o3"]
ADD ENTRY en ATTRS radio1={"o1": "Jeden", "o2": "Dwa", "o3": "Trzy"}
ADD ATTRIBUTE radio2=Text
ADD LABEL en ATTRS radio2="Radio btn horizontal"
ADD LABEL pl ATTRS radio2="Radio guzik poziomy"
ADD ENTRY_CODE ATTRS radio2=["o1", "o2", "o3", "o4", "o5", "o6"]
ADD ENTRY en ATTRS radio2={"o1": "Jeden", "o2": "Dwa", "o3": "Trzy", "o4": "Cztery", "o5": "Pięć", "o6": "Sześć"}
ADD ATTRIBUTE radio3=Boolean
ADD LABEL en ATTRS radio3="Radio boolean"
ADD LABEL pl ATTRS radio3="Radio bulin"
ADD CONFORMANCE ATTRS radio3=M
ADD ATTRIBUTE text_attr1=Text text_attr2=Text
ADD LABEL en ATTRS\
  text_attr1="Vehicle"\
  text_attr2="Wheel"
ADD LABEL pl ATTRS\
  text_attr1="Pojazd"\
  text_attr2="Koło"
ADD ATTRIBUTE isbn=Text
ADD ATTRIBUTE attr12=Text
ADD LABEL en ATTRS isbn="ISBN"
ADD LABEL pl ATTRS isbn="ISBN"
`

  const bundleResp = await axios.post(
    "https://repository.oca.argo.colossi.network/api/oca-bundles",
    ocafile,
  )

  expect(bundleResp.data).toHaveProperty("said")

  return bundleResp.data.said
}

const setupPres = (bundleSAID: string) => {
  const po = {
    presentation: {
      v: "1.0.0",
      bd: bundleSAID,
      l: ["eng", "pol", "deu"],
      d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
      p: [
        {
          n: "page 2",
          ao: ["select", "selectmulti", "i", "img", "num", "date", "time", "nice_attr"],
        },
        {
          n: "page 1",
          ao: ["passed", "d", "sign"],
        },
      ],
      po: ["page 1", "page 2"],
      pl: {
        eng: {
          "page 1": "First page",
          "page 2": "Second page",
        },
        pol: {
          "page 1": "Pierwsza strona",
          "page 2": "Druga strona",
        },
        deu: {
          "page 1": "Erste Seite",
          "page 2": "Zweite Seite",
        },
        ita: {
          "page 1": "Prima pagina",
          "page 2": "Seconda pagina",
        },
      },
      i: [
        // interaction
        {
          m: "web", // interaction method
          c: "capture", // context
          a: {
            // attributes
            num: { t: "number", r: [0, 100] },
            d: { t: "textarea" }, // capture "d" field as textarea
            img: { t: "file" }, // capture "img" field as file
            sign: { t: "signature" }, // capture "sign" field as signature
            sign_with_geolocation: {
              t: "signature",
              m: {
                canvas: "signature_canvas",
                geolocation: {
                  latitude: "geolocation.latitude",
                  longitude: "geolocation.longitude",
                  accuracy: "geolocation.accuracy",
                  timestamp: "timestamp",
                },
              },
            },
            radio1: { t: "radio", o: "vertical" },
            radio2: { t: "radio", o: "horizontal" },
            radio3: { t: "radio", o: "horizontal" },
            selectmulti: { t: "select", va: "multiple" },
            date: { t: "date" },
            time: { t: "time" },
            list_date: { t: "datetime" },
            list_file: { t: "file" },
            list_sign: { t: "signature" },
            "customer.building.address.street": { t: "textarea" },
            "customer.building.address.is_nice": { t: "radio", o: "vertical" },
            "devices.manufacturer.address.is_nice": { t: "radio", o: "horizontal" },
            "devices.manufacturer.parts.photo": { t: "file" },
            isbn: { t: "code_scanner" },
          },
        },
      ],
    },
  }
  return po
}
