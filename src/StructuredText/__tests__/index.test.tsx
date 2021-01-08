import { mount, shallow, render } from "enzyme";
import * as React from "react";
import {
  StructuredText,
  StructuredTextGraphQlResponse,
  RenderError,
  renderRule,
} from "../index";
import { isHeading } from "datocms-structured-text-utils";

describe.only("StructuredText", () => {
  describe("with no value", () => {
    it("renders null", () => {
      const wrapper = mount(<StructuredText structuredText={null} />);
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe("simple dast with no links/blocks", () => {
    const structuredText: StructuredTextGraphQlResponse = {
      value: {
        schema: "dast",
        document: {
          type: "root",
          children: [
            {
              type: "heading",
              level: 1,
              children: [
                {
                  type: "span",
                  value: "This is a title!",
                },
              ],
            },
          ],
        },
      },
    };

    describe("with default rules", () => {
      it("renders the document", () => {
        const wrapper = mount(
          <StructuredText structuredText={structuredText} />
        );
        expect(wrapper).toMatchSnapshot();
      });
    });

    describe("with custom rules", () => {
      it.only("renders the document", () => {
        const wrapper = mount(
          <StructuredText
            structuredText={structuredText}
            renderText={(text, key) => {
              return (
                <React.Fragment key={key}>
                  {text.replace(/This/, "That")}!!
                </React.Fragment>
              );
            }}
            customRules={[
              renderRule(
                isHeading,
                ({ adapter: { renderNode }, node, children, key }) => {
                  return renderNode(`h${node.level + 1}`, { key }, children);
                }
              ),
            ]}
          />
        );
        expect(wrapper).toMatchSnapshot();
      });
    });
  });

  describe("with links/blocks", () => {
    type QuoteRecord = {
      id: string;
      __typename: "QuoteRecord";
      quote: string;
      author: string;
    };

    type DocPageRecord = {
      id: string;
      __typename: "DocPageRecord";
      slug: string;
      title: string;
    };

    const structuredText: StructuredTextGraphQlResponse<
      QuoteRecord | DocPageRecord
    > = {
      value: {
        schema: "dast",
        document: {
          type: "root",
          children: [
            {
              type: "heading",
              level: 1,
              children: [
                {
                  type: "span",
                  value: "This is a ",
                },
                {
                  type: "span",
                  marks: ["highlight"],
                  value: "title",
                },
                {
                  type: "inlineItem",
                  item: "123",
                },
                {
                  type: "itemLink",
                  item: "123",
                  children: [{ type: "span", value: "here!" }],
                },
              ],
            },
            {
              type: "block",
              item: "456",
            },
          ],
        },
      },
      blocks: [
        {
          id: "456",
          __typename: "QuoteRecord",
          quote: "Foo bar.",
          author: "Mark Smith",
        },
      ],
      links: [
        {
          id: "123",
          __typename: "DocPageRecord",
          title: "How to code",
          slug: "how-to-code",
        },
      ],
    };

    describe("with default rules", () => {
      it("renders the document", () => {
        const wrapper = mount(
          <StructuredText
            structuredText={structuredText}
            renderInlineRecord={({ record }) => {
              switch (record.__typename) {
                case "DocPageRecord":
                  return <a href={`/docs/${record.slug}`}>{record.title}</a>;
                default:
                  return null;
              }
            }}
            renderLinkToRecord={({ record, children }) => {
              switch (record.__typename) {
                case "DocPageRecord":
                  return <a href={`/docs/${record.slug}`}>{children}</a>;
                default:
                  return null;
              }
            }}
            renderBlock={({ record }) => {
              switch (record.__typename) {
                case "QuoteRecord":
                  return (
                    <figure>
                      <blockquote>{record.quote}</blockquote>
                      <figcaption>{record.author}</figcaption>
                    </figure>
                  );
                default:
                  return null;
              }
            }}
          />
        );
        expect(wrapper).toMatchSnapshot();
      });
    });

    describe("with missing renderInlineRecord prop", () => {
      it("raises an error", () => {
        expect(() => {
          shallow(<StructuredText structuredText={structuredText} />);
        }).toThrow(RenderError);
      });
    });

    describe("with missing record", () => {
      it("raises an error", () => {
        expect(() => {
          shallow(
            <StructuredText
              structuredText={{ ...structuredText, links: [] }}
              renderInlineRecord={() => {
                return null;
              }}
            />
          );
        }).toThrow(RenderError);
      });
    });
  });
});
